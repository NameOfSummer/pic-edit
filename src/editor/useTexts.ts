import { useCallback, useState } from "react";
import { measureTextBox } from "./textGeometry";
import {
  DEFAULT_TEXT_BACKGROUND,
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
    const fontSize = style?.fontSize ?? DEFAULT_TEXT_SIZE;
    const fontWeight = style?.fontWeight ?? DEFAULT_TEXT_WEIGHT;
    const box = measureTextBox({ text: content, fontSize, fontWeight });
    const draft: TextAnnotation = {
      id: crypto.randomUUID(),
      x: Math.round(origin.x),
      y: Math.round(origin.y),
      width: box.width,
      height: box.height,
      text: content,
      fontSize,
      fontWeight,
      color: style?.color ?? DEFAULT_TEXT_COLOR,
      backgroundColor: style?.backgroundColor ?? DEFAULT_TEXT_BACKGROUND,
      rotation: 0,
    };
    setTexts((current) => [...current, draft]);
    setSelectedTextId(draft.id);
    return draft.id;
  }, []);

  const insertText = useCallback((data: Omit<TextAnnotation, "id">) => {
    const measured = measureTextBox(data);
    const draft: TextAnnotation = {
      ...data,
      width: data.width > 0 ? data.width : measured.width,
      height: data.height > 0 ? data.height : measured.height,
      backgroundColor: data.backgroundColor ?? DEFAULT_TEXT_BACKGROUND,
      id: crypto.randomUUID(),
    };
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
    setTexts(
      next.map((item) => ({
        ...item,
        backgroundColor: item.backgroundColor ?? DEFAULT_TEXT_BACKGROUND,
      })),
    );
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
