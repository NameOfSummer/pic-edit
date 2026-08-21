import { useCallback, useEffect, useRef, useState } from "react";
import { filesToLayers } from "./images";
import type { ImageLayer, Point } from "./types";

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

  const updateLayer = useCallback((id: string, patch: Partial<Pick<ImageLayer, "x" | "y" | "width" | "height">>) => {
    setLayers((current) => current.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)));
  }, []);

  const bringToFront = useCallback((id: string) => {
    setLayers((current) => {
      const index = current.findIndex((layer) => layer.id === id);
      if (index < 0 || index === current.length - 1) {
        return current;
      }
      const next = [...current];
      const [layer] = next.splice(index, 1);
      next.push(layer);
      return next;
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
    addFiles,
    updateLayer,
    bringToFront,
    removeSelected,
  };
}
