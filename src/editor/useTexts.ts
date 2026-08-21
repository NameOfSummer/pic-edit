import { useCallback, useState } from "react";
import {
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_CONTENT,
  DEFAULT_TEXT_SIZE,
  DEFAULT_TEXT_WEIGHT,
  type Point,
  type TextAnnotation,
  type TextPatch,
  type TextStyle,
} from "./types";

export function useTexts() {
  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  const addText = useCallback((origin: Point, style?: Partial<TextStyle>, content = DEFAULT_TEXT_CONTENT) => {
    const draft: TextAnnotation = {
      id: crypto.randomUUID(),
      x: Math.round(origin.x),
      y: Math.round(origin.y),
      text: content,
      fontSize: style?.fontSize ?? DEFAULT_TEXT_SIZE,
      fontWeight: style?.fontWeight ?? DEFAULT_TEXT_WEIGHT,
      color: style?.color ?? DEFAULT_TEXT_COLOR,
      rotation: 0,
    };
    setTexts((current) => [...current, draft]);
    setSelectedTextId(draft.id);
    return draft.id;
  }, []);

  const insertText = useCallback((data: Omit<TextAnnotation, "id">) => {
    const draft: TextAnnotation = { ...data, id: crypto.randomUUID() };
    setTexts((current) => [...current, draft]);
    setSelectedTextId(draft.id);
    return draft.id;
  }, []);

  const updateText = useCallback((id: string, patch: TextPatch) => {
    setTexts((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const removeText = useCallback((id: string) => {
    setTexts((current) => current.filter((item) => item.id !== id));
    setSelectedTextId((current) => (current === id ? null : current));
  }, []);

  const removeSelectedText = useCallback(() => {
    if (!selectedTextId) {
      return;
    }
    removeText(selectedTextId);
  }, [removeText, selectedTextId]);

  const clearTextSelection = useCallback(() => {
    setSelectedTextId(null);
  }, []);

  const replaceAll = useCallback((next: TextAnnotation[]) => {
    setTexts(next.map((item) => ({ ...item })));
    setSelectedTextId(null);
  }, []);

  const clearAll = useCallback(() => {
    setTexts([]);
    setSelectedTextId(null);
  }, []);

  return {
    texts,
    selectedTextId,
    setSelectedTextId,
    addText,
    insertText,
    updateText,
    removeText,
    removeSelectedText,
    clearTextSelection,
    replaceAll,
    clearAll,
  };
}
