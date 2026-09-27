import { useCallback, useState } from "react";
import {
  DEFAULT_COUNTER_COLOR,
  DEFAULT_COUNTER_SIZE,
  type CounterAnnotation,
  type CounterPatch,
  type CounterStyle,
  type Point,
} from "./types";

/**
 * 次に付ける番号を返す。既存がなければ 1。
 * @param counters 既存のカウンター
 * @returns {number} 最大番号 + 1
 */
function nextCounterValue(counters: CounterAnnotation[]): number {
  if (counters.length === 0) {
    return 1;
  }
  return Math.max(...counters.map((item) => item.value)) + 1;
}

/**
 * 削除された番号より大きい番号を 1 つ繰り下げる。同番号の複製はそのまま残す。
 * @param counters 残っているカウンター
 * @param removedValue 削除した番号
 * @returns {CounterAnnotation[]} 繰り下げ後の配列
 */
function afterRemove(counters: CounterAnnotation[], removedValue: number): CounterAnnotation[] {
  return counters.map((item) =>
    item.value > removedValue ? { ...item, value: item.value - 1 } : item,
  );
}

/**
 * カウンター注釈の配列と選択状態を持つ。
 * @returns {object} 追加・更新・削除と選択 id
 */
export function useCounters() {
  const [counters, setCounters] = useState<CounterAnnotation[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string | null>(null);

  const addCounter = useCallback((origin: Point, style?: Partial<CounterStyle>) => {
    const id = crypto.randomUUID();
    setCounters((current) => {
      const draft: CounterAnnotation = {
        id,
        x: Math.round(origin.x),
        y: Math.round(origin.y),
        value: nextCounterValue(current),
        color: style?.color ?? DEFAULT_COUNTER_COLOR,
        size: style?.size ?? DEFAULT_COUNTER_SIZE,
      };
      return [...current, draft];
    });
    setSelectedCounterId(id);
    return id;
  }, []);

  const insertCounter = useCallback((data: Omit<CounterAnnotation, "id">) => {
    const draft: CounterAnnotation = { ...data, id: crypto.randomUUID() };
    setCounters((current) => [...current, draft]);
    setSelectedCounterId(draft.id);
    return draft.id;
  }, []);

  const updateCounter = useCallback((id: string, patch: CounterPatch) => {
    setCounters((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const removeCounter = useCallback((id: string) => {
    setCounters((current) => {
      const target = current.find((item) => item.id === id);
      if (!target) {
        return current;
      }
      return afterRemove(
        current.filter((item) => item.id !== id),
        target.value,
      );
    });
    setSelectedCounterId((current) => (current === id ? null : current));
  }, []);

  const removeSelectedCounter = useCallback(() => {
    if (!selectedCounterId) {
      return;
    }
    removeCounter(selectedCounterId);
  }, [removeCounter, selectedCounterId]);

  const clearCounterSelection = useCallback(() => {
    setSelectedCounterId(null);
  }, []);

  const replaceAll = useCallback((next: CounterAnnotation[]) => {
    setCounters(next.map((item) => ({ ...item })));
    setSelectedCounterId(null);
  }, []);

  const clearAll = useCallback(() => {
    setCounters([]);
    setSelectedCounterId(null);
  }, []);

  return {
    counters,
    selectedCounterId,
    setSelectedCounterId,
    addCounter,
    insertCounter,
    updateCounter,
    removeCounter,
    removeSelectedCounter,
    clearCounterSelection,
    replaceAll,
    clearAll,
  };
}
