import { useCallback, useState } from "react";
import {
  DEFAULT_ANNOTATION_COLOR,
  DEFAULT_ANNOTATION_STROKE,
  type AnnotationStyle,
  type ArrowAnnotation,
  type ArrowPatch,
  type Point,
} from "./types";
import { arrowLength } from "./arrowGeometry";

const MIN_ARROW_LENGTH = 16;

export function useArrows() {
  const [arrows, setArrows] = useState<ArrowAnnotation[]>([]);
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);

  const addArrow = useCallback((from: Point, to: Point, style?: Partial<AnnotationStyle>) => {
    const draft: ArrowAnnotation = {
      id: crypto.randomUUID(),
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      color: style?.color ?? DEFAULT_ANNOTATION_COLOR,
      strokeWidth: style?.strokeWidth ?? DEFAULT_ANNOTATION_STROKE,
    };
    if (arrowLength(draft) < MIN_ARROW_LENGTH) {
      return null;
    }
    setArrows((current) => [...current, draft]);
    setSelectedArrowId(draft.id);
    return draft.id;
  }, []);

  const insertArrow = useCallback((data: Omit<ArrowAnnotation, "id">) => {
    const draft: ArrowAnnotation = { ...data, id: crypto.randomUUID() };
    setArrows((current) => [...current, draft]);
    setSelectedArrowId(draft.id);
    return draft.id;
  }, []);

  const updateArrow = useCallback((id: string, patch: ArrowPatch) => {
    setArrows((current) => current.map((arrow) => (arrow.id === id ? { ...arrow, ...patch } : arrow)));
  }, []);

  const removeArrow = useCallback((id: string) => {
    setArrows((current) => current.filter((arrow) => arrow.id !== id));
    setSelectedArrowId((current) => (current === id ? null : current));
  }, []);

  const removeSelectedArrow = useCallback(() => {
    if (!selectedArrowId) {
      return;
    }
    removeArrow(selectedArrowId);
  }, [removeArrow, selectedArrowId]);

  const clearArrowSelection = useCallback(() => {
    setSelectedArrowId(null);
  }, []);

  const replaceAll = useCallback((next: ArrowAnnotation[]) => {
    setArrows(next.map((item) => ({ ...item })));
    setSelectedArrowId(null);
  }, []);

  const clearAll = useCallback(() => {
    setArrows([]);
    setSelectedArrowId(null);
  }, []);

  return {
    arrows,
    selectedArrowId,
    setSelectedArrowId,
    addArrow,
    insertArrow,
    updateArrow,
    removeArrow,
    removeSelectedArrow,
    clearArrowSelection,
    replaceAll,
    clearAll,
  };
}
