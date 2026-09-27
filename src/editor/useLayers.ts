import { useCallback, useEffect, useRef, useState } from "react";
import { cropImageSrc, filesToLayers } from "./images";
import type { CropRect, ImageLayer, LayerPatch, Point } from "./types";

/**
 * レイヤーを指定位置へ移す。範囲外や同じ位置なら配列をそのまま返す。
 * @param layers 現在の重ね順
 * @param id 動かすレイヤー
 * @param toIndex 移動先のインデックス
 * @returns {ImageLayer[]} 新しい重ね順
 */
function moveLayer(layers: ImageLayer[], id: string, toIndex: number): ImageLayer[] {
  const fromIndex = layers.findIndex((layer) => layer.id === id);
  if (fromIndex < 0 || toIndex < 0 || toIndex >= layers.length || fromIndex === toIndex) {
    return layers;
  }
  const next = [...layers];
  const [layer] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, layer);
  return next;
}

/**
 * 画像レイヤーの配列と選択状態を持つ。
 * @returns {object} 追加・移動・削除・トリミングと選択 id
 */
export function useLayers() {
  const [layers, setLayers] = useState<ImageLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const layersRef = useRef(layers);
  layersRef.current = layers;

  const addFiles = useCallback(async (files: File[], origin: Point) => {
    if (files.length === 0) {
      return;
    }

    const next = await filesToLayers(files, origin, {
      x: window.innerWidth,
      y: window.innerHeight,
    });

    setLayers((current) => [...current, ...next]);
    setSelectedId(next.at(-1)?.id ?? null);
  }, []);

  const updateLayer = useCallback((id: string, patch: LayerPatch) => {
    setLayers((current) =>
      current.map((layer) => {
        if (layer.id !== id) {
          return layer;
        }
        // src 差し替え時も即 revoke しない（Undo 用スナップショットが参照するため）
        return { ...layer, ...patch };
      }),
    );
  }, []);

  const selectLayer = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const bringToFront = useCallback((id: string) => {
    setLayers((current) => moveLayer(current, id, current.length - 1));
    setSelectedId(id);
  }, []);

  const sendToBack = useCallback((id: string) => {
    setLayers((current) => moveLayer(current, id, 0));
    setSelectedId(id);
  }, []);

  const bringForward = useCallback((id: string) => {
    setLayers((current) => {
      const index = current.findIndex((layer) => layer.id === id);
      if (index < 0 || index >= current.length - 1) {
        return current;
      }
      return moveLayer(current, id, index + 1);
    });
    setSelectedId(id);
  }, []);

  const sendBackward = useCallback((id: string) => {
    setLayers((current) => {
      const index = current.findIndex((layer) => layer.id === id);
      if (index <= 0) {
        return current;
      }
      return moveLayer(current, id, index - 1);
    });
    setSelectedId(id);
  }, []);

  const removeSelected = useCallback(() => {
    setLayers((current) => {
      const target = current.find((layer) => layer.id === selectedId);
      if (target) {
        URL.revokeObjectURL(target.src);
      }
      return current.filter((layer) => layer.id !== selectedId);
    });
    setSelectedId(null);
  }, [selectedId]);

  const insertLayer = useCallback((data: Omit<ImageLayer, "id">) => {
    const next: ImageLayer = { ...data, id: crypto.randomUUID() };
    setLayers((current) => [...current, next]);
    setSelectedId(next.id);
    return next.id;
  }, []);

  const applyCrop = useCallback(
    async (crop: CropRect) => {
      const target = layersRef.current.find((layer) => layer.id === selectedId);
      if (!target) {
        return;
      }

      const minSize = 8;
      if (crop.width < minSize || crop.height < minSize) {
        return;
      }

      const cropped = await cropImageSrc(target, crop);
      updateLayer(target.id, {
        src: cropped.src,
        naturalWidth: cropped.naturalWidth,
        naturalHeight: cropped.naturalHeight,
        width: cropped.width,
        height: cropped.height,
        x: Math.round(target.x + crop.x),
        y: Math.round(target.y + crop.y),
      });
    },
    [selectedId, updateLayer],
  );

  const replaceAll = useCallback((next: ImageLayer[]) => {
    setLayers((current) => {
      const nextSrcs = new Set(next.map((layer) => layer.src));
      for (const layer of current) {
        if (!nextSrcs.has(layer.src)) {
          URL.revokeObjectURL(layer.src);
        }
      }
      return next.map((layer) => ({ ...layer }));
    });
    setSelectedId(null);
  }, []);

  const clearAll = useCallback(() => {
    setLayers((current) => {
      for (const layer of current) {
        URL.revokeObjectURL(layer.src);
      }
      return [];
    });
    setSelectedId(null);
  }, []);

  useEffect(() => {
    return () => {
      for (const layer of layersRef.current) {
        URL.revokeObjectURL(layer.src);
      }
    };
  }, []);

  return {
    layers,
    selectedId,
    setSelectedId,
    selectLayer,
    addFiles,
    updateLayer,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    removeSelected,
    insertLayer,
    applyCrop,
    replaceAll,
    clearAll,
  };
}
