import { useCallback, useState } from "react";
import { markerLength, straightenMarkerLine } from "./markerGeometry";
import {
  DEFAULT_MARKER_COLOR,
  DEFAULT_MARKER_STROKE,
  type MarkerAnnotation,
  type MarkerPatch,
  type MarkerStyle,
  type Point,
} from "./types";

/** 追加を受け付けるマーカーの最短長（px）。 */
const MIN_MARKER_LENGTH = 12;

/**
 * マーカー注釈の配列と選択状態を持つ。
 * @returns {object} 追加・更新・削除と選択 id
 */
export function useMarkers() {
  const [markers, setMarkers] = useState<MarkerAnnotation[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const addMarker = useCallback(
    (from: Point, to: Point, style?: Partial<MarkerStyle>, shiftKey = false) => {
      const line = straightenMarkerLine(from, to, { shiftKey });
      const draft: MarkerAnnotation = {
        id: crypto.randomUUID(),
        ...line,
        color: style?.color ?? DEFAULT_MARKER_COLOR,
        strokeWidth: style?.strokeWidth ?? DEFAULT_MARKER_STROKE,
      };
      if (markerLength(draft) < MIN_MARKER_LENGTH) {
        return null;
      }
      setMarkers((current) => [...current, draft]);
      return draft.id;
    },
    [],
  );

  const insertMarker = useCallback((data: Omit<MarkerAnnotation, "id">) => {
    const draft: MarkerAnnotation = { ...data, id: crypto.randomUUID() };
    setMarkers((current) => [...current, draft]);
    setSelectedMarkerId(draft.id);
    return draft.id;
  }, []);

  const updateMarker = useCallback((id: string, patch: MarkerPatch) => {
    setMarkers((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const removeMarker = useCallback((id: string) => {
    setMarkers((current) => current.filter((item) => item.id !== id));
    setSelectedMarkerId((current) => (current === id ? null : current));
  }, []);

  const removeSelectedMarker = useCallback(() => {
    if (!selectedMarkerId) {
      return;
    }
    removeMarker(selectedMarkerId);
  }, [removeMarker, selectedMarkerId]);

  const clearMarkerSelection = useCallback(() => {
    setSelectedMarkerId(null);
  }, []);

  const replaceAll = useCallback((next: MarkerAnnotation[]) => {
    setMarkers(next.map((item) => ({ ...item })));
    setSelectedMarkerId(null);
  }, []);

  const clearAll = useCallback(() => {
    setMarkers([]);
    setSelectedMarkerId(null);
  }, []);

  return {
    markers,
    selectedMarkerId,
    setSelectedMarkerId,
    addMarker,
    insertMarker,
    updateMarker,
    removeMarker,
    removeSelectedMarker,
    clearMarkerSelection,
    replaceAll,
    clearAll,
  };
}
