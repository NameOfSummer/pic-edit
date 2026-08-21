import { useCallback, useState } from "react";
import { normalizeRectFromDrag } from "./rectGeometry";
import {
  DEFAULT_ANNOTATION_COLOR,
  DEFAULT_ANNOTATION_STROKE,
  type AnnotationStyle,
  type Point,
  type RectAnnotation,
  type RectPatch,
} from "./types";

const MIN_RECT_SIZE = 16;

export function useRects() {
  const [rects, setRects] = useState<RectAnnotation[]>([]);
  const [selectedRectId, setSelectedRectId] = useState<string | null>(null);

  const addRect = useCallback((from: Point, to: Point, style?: Partial<AnnotationStyle>) => {
    const box = normalizeRectFromDrag(from.x, from.y, to.x, to.y);
    if (box.width < MIN_RECT_SIZE || box.height < MIN_RECT_SIZE) {
      return null;
    }
    const draft: RectAnnotation = {
      id: crypto.randomUUID(),
      ...box,
      rotation: 0,
      color: style?.color ?? DEFAULT_ANNOTATION_COLOR,
      strokeWidth: style?.strokeWidth ?? DEFAULT_ANNOTATION_STROKE,
    };
    setRects((current) => [...current, draft]);
    setSelectedRectId(draft.id);
    return draft.id;
  }, []);

  const insertRect = useCallback((data: Omit<RectAnnotation, "id">) => {
    const draft: RectAnnotation = { ...data, id: crypto.randomUUID() };
    setRects((current) => [...current, draft]);
    setSelectedRectId(draft.id);
    return draft.id;
  }, []);

  const updateRect = useCallback((id: string, patch: RectPatch) => {
    setRects((current) => current.map((rect) => (rect.id === id ? { ...rect, ...patch } : rect)));
  }, []);

  const removeRect = useCallback((id: string) => {
    setRects((current) => current.filter((rect) => rect.id !== id));
    setSelectedRectId((current) => (current === id ? null : current));
  }, []);

  const removeSelectedRect = useCallback(() => {
    if (!selectedRectId) {
      return;
    }
    removeRect(selectedRectId);
  }, [removeRect, selectedRectId]);

  const clearRectSelection = useCallback(() => {
    setSelectedRectId(null);
  }, []);

  const replaceAll = useCallback((next: RectAnnotation[]) => {
    setRects(next.map((item) => ({ ...item })));
    setSelectedRectId(null);
  }, []);

  const clearAll = useCallback(() => {
    setRects([]);
    setSelectedRectId(null);
  }, []);

  return {
    rects,
    selectedRectId,
    setSelectedRectId,
    addRect,
    insertRect,
    updateRect,
    removeRect,
    removeSelectedRect,
    clearRectSelection,
    replaceAll,
    clearAll,
  };
}
