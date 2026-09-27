/** 矩形の辺・角を示すハンドル名。 */
export type ResizeHandle = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

/** リサイズ前の矩形。回転は含まない。 */
export type BoxRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** 選択枠に置くリサイズハンドルの位置とカーソル。 */
export const BOX_RESIZE_HANDLES: { id: ResizeHandle; className: string }[] = [
  { id: "nw", className: "-left-1.5 -top-1.5 cursor-nwse-resize" },
  { id: "ne", className: "-right-1.5 -top-1.5 cursor-nesw-resize" },
  { id: "sw", className: "-left-1.5 -bottom-1.5 cursor-nesw-resize" },
  { id: "se", className: "-right-1.5 -bottom-1.5 cursor-nwse-resize" },
  { id: "n", className: "left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize" },
  { id: "s", className: "left-1/2 -bottom-1.5 -translate-x-1/2 cursor-ns-resize" },
  { id: "w", className: "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
  { id: "e", className: "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
];

/**
 * 画面上の移動量を、回転前のローカル座標の移動量に変換する。
 * @param dx 画面上の X 移動
 * @param dy 画面上の Y 移動
 * @param rotationDeg 矩形の時計回り角度
 * @returns {{ x: number; y: number }} ローカル座標の移動量
 */
export function screenDeltaToLocal(dx: number, dy: number, rotationDeg: number): { x: number; y: number } {
  const radians = (-rotationDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos,
  };
}

/**
 * ハンドルのドラッグ量から、最小サイズを守った新しい矩形を返す。
 * 回転は呼び出し側で打ち消したローカル移動量を渡す。
 * @param options ハンドル、元矩形、ローカル移動量、最小サイズ
 * @returns {BoxRect} リサイズ後の矩形
 */
export function applyBoxResize(options: {
  handle: ResizeHandle;
  origin: BoxRect;
  localDx: number;
  localDy: number;
  minWidth: number;
  minHeight: number;
}): BoxRect {
  const { handle, origin, localDx, localDy, minWidth, minHeight } = options;
  let nextX = origin.x;
  let nextY = origin.y;
  let nextWidth = origin.width;
  let nextHeight = origin.height;

  if (handle.includes("w")) {
    nextX = origin.x + localDx;
    nextWidth = origin.width - localDx;
  }
  if (handle.includes("e")) {
    nextWidth = origin.width + localDx;
  }
  if (handle.includes("n")) {
    nextY = origin.y + localDy;
    nextHeight = origin.height - localDy;
  }
  if (handle.includes("s")) {
    nextHeight = origin.height + localDy;
  }

  if (nextWidth < minWidth) {
    if (handle.includes("w")) {
      nextX = origin.x + origin.width - minWidth;
    }
    nextWidth = minWidth;
  }
  if (nextHeight < minHeight) {
    if (handle.includes("n")) {
      nextY = origin.y + origin.height - minHeight;
    }
    nextHeight = minHeight;
  }

  return {
    x: Math.round(nextX),
    y: Math.round(nextY),
    width: Math.round(nextWidth),
    height: Math.round(nextHeight),
  };
}
