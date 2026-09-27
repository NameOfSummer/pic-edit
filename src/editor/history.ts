import type {
  ArrowAnnotation,
  CounterAnnotation,
  ImageLayer,
  MarkerAnnotation,
  MosaicAnnotation,
  RectAnnotation,
  TextAnnotation,
} from "./types";

/** Undo 用に保存するキャンバス全体。 */
export type EditorSnapshot = {
  layers: ImageLayer[];
  arrows: ArrowAnnotation[];
  rects: RectAnnotation[];
  texts: TextAnnotation[];
  counters: CounterAnnotation[];
  mosaics: MosaicAnnotation[];
  markers: MarkerAnnotation[];
};

/** 履歴に残す操作回数の上限。 */
const HISTORY_LIMIT = 50;

/**
 * スナップショットを浅いコピーで複製する。
 * @param snapshot 複製元
 * @returns {EditorSnapshot} 独立したコピー
 */
function cloneSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  return {
    layers: snapshot.layers.map((item) => ({ ...item })),
    arrows: snapshot.arrows.map((item) => ({ ...item })),
    rects: snapshot.rects.map((item) => ({ ...item })),
    texts: snapshot.texts.map((item) => ({ ...item })),
    counters: snapshot.counters.map((item) => ({ ...item })),
    mosaics: snapshot.mosaics.map((item) => ({ ...item })),
    markers: snapshot.markers.map((item) => ({ ...item })),
  };
}

/**
 * Undo / Redo のスタックを作る。
 * @returns {object} push・undo・redo・clear
 */
export function createHistoryController() {
  let past: EditorSnapshot[] = [];
  let future: EditorSnapshot[] = [];

  return {
    push(snapshot: EditorSnapshot) {
      past.push(cloneSnapshot(snapshot));
      if (past.length > HISTORY_LIMIT) {
        past.shift();
      }
      future = [];
    },
    undo(current: EditorSnapshot): EditorSnapshot | null {
      const previous = past.pop();
      if (!previous) {
        return null;
      }
      future.push(cloneSnapshot(current));
      return {
        ...previous,
        markers: previous.markers ?? [],
      };
    },
    redo(current: EditorSnapshot): EditorSnapshot | null {
      const next = future.pop();
      if (!next) {
        return null;
      }
      past.push(cloneSnapshot(current));
      return {
        ...next,
        markers: next.markers ?? [],
      };
    },
    clear() {
      past = [];
      future = [];
    },
    canUndo() {
      return past.length > 0;
    },
    canRedo() {
      return future.length > 0;
    },
  };
}

/** createHistoryController の戻り値。 */
export type HistoryController = ReturnType<typeof createHistoryController>;
