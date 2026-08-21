import { useCallback, useState } from "react";
import { normalizeRectFromDrag } from "./rectGeometry";
import {
  DEFAULT_MOSAIC_BLOCK,
  type MosaicAnnotation,
  type MosaicPatch,
  type MosaicStyle,
  type Point,
} from "./types";

const MIN_MOSAIC_SIZE = 16;

export function useMosaics() {
  const [mosaics, setMosaics] = useState<MosaicAnnotation[]>([]);
  const [selectedMosaicId, setSelectedMosaicId] = useState<string | null>(null);

  const addMosaic = useCallback((from: Point, to: Point, style?: Partial<MosaicStyle>) => {
    const box = normalizeRectFromDrag(from.x, from.y, to.x, to.y);
    if (box.width < MIN_MOSAIC_SIZE || box.height < MIN_MOSAIC_SIZE) {
      return null;
    }
    const draft: MosaicAnnotation = {
      id: crypto.randomUUID(),
      ...box,
      rotation: 0,
      blockSize: style?.blockSize ?? DEFAULT_MOSAIC_BLOCK,
    };
    setMosaics((current) => [...current, draft]);
    setSelectedMosaicId(draft.id);
    return draft.id;
  }, []);

  const insertMosaic = useCallback((data: Omit<MosaicAnnotation, "id">) => {
    const draft: MosaicAnnotation = { ...data, id: crypto.randomUUID() };
    setMosaics((current) => [...current, draft]);
    setSelectedMosaicId(draft.id);
    return draft.id;
  }, []);

  const updateMosaic = useCallback((id: string, patch: MosaicPatch) => {
    setMosaics((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const removeMosaic = useCallback((id: string) => {
    setMosaics((current) => current.filter((item) => item.id !== id));
    setSelectedMosaicId((current) => (current === id ? null : current));
  }, []);

  const removeSelectedMosaic = useCallback(() => {
    if (!selectedMosaicId) {
      return;
    }
    removeMosaic(selectedMosaicId);
  }, [removeMosaic, selectedMosaicId]);

  const clearMosaicSelection = useCallback(() => {
    setSelectedMosaicId(null);
  }, []);

  const replaceAll = useCallback((next: MosaicAnnotation[]) => {
    setMosaics(next.map((item) => ({ ...item })));
    setSelectedMosaicId(null);
  }, []);

  const clearAll = useCallback(() => {
    setMosaics([]);
    setSelectedMosaicId(null);
  }, []);

  return {
    mosaics,
    selectedMosaicId,
    setSelectedMosaicId,
    addMosaic,
    insertMosaic,
    updateMosaic,
    removeMosaic,
    removeSelectedMosaic,
    clearMosaicSelection,
    replaceAll,
    clearAll,
  };
}
