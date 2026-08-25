/** 矩形ボックスの辺・角リサイズ（ローカル座標、回転は呼び出し側で打ち消す） */

export type ResizeHandle = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

export type BoxRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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

/** 画面上の移動量を、回転前のローカル座標の移動量に変換する */
export function screenDeltaToLocal(dx: number, dy: number, rotationDeg: number): { x: number; y: number } {
  const radians = (-rotationDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos,
  };
}

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
