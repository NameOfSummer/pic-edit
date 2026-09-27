import type { RectAnnotation } from "./types";

/** 枠の外接矩形。 */
export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/**
 * 回転後の枠の四隅を返す。
 * @param rect 枠
 * @returns {Array<{ x: number; y: number }>} 四隅
 */
function rotatedCorners(rect: RectAnnotation): Array<{ x: number; y: number }> {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const radians = (rect.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  const locals = [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH },
  ];
  return locals.map((point) => ({
    x: cx + point.x * cos - point.y * sin,
    y: cy + point.x * sin + point.y * cos,
  }));
}

/**
 * 線の太さを含めた枠の外接矩形を返す。
 * @param rect 枠
 * @returns {Bounds} 外接矩形
 */
export function getRectBounds(rect: RectAnnotation): Bounds {
  const corners = rotatedCorners(rect);
  const pad = rect.strokeWidth;
  return {
    minX: Math.min(...corners.map((point) => point.x)) - pad,
    minY: Math.min(...corners.map((point) => point.y)) - pad,
    maxX: Math.max(...corners.map((point) => point.x)) + pad,
    maxY: Math.max(...corners.map((point) => point.y)) + pad,
  };
}

/**
 * ドラッグの始点と終点から、左上原点の矩形を作る。
 * @param x1 始点 X
 * @param y1 始点 Y
 * @param x2 終点 X
 * @param y2 終点 Y
 * @returns {{ x: number; y: number; width: number; height: number }} 正規化した矩形
 */
export function normalizeRectFromDrag(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x: number; y: number; width: number; height: number } {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  return {
    x,
    y,
    width: Math.max(1, Math.abs(x2 - x1)),
    height: Math.max(1, Math.abs(y2 - y1)),
  };
}

/**
 * 書き出しキャンバスに枠を描く。
 * @param ctx 描画先
 * @param rect 枠
 * @param offsetX 書き出し原点 X
 * @param offsetY 書き出し原点 Y
 * @param scale 表示サイズに対する倍率
 * @returns {void}
 */
export function drawRectOnCanvas(
  ctx: CanvasRenderingContext2D,
  rect: RectAnnotation,
  offsetX: number,
  offsetY: number,
  scale: number,
): void {
  const centerX = (rect.x + rect.width / 2 - offsetX) * scale;
  const centerY = (rect.y + rect.height / 2 - offsetY) * scale;
  const width = rect.width * scale;
  const height = rect.height * scale;
  const strokeWidth = Math.max(1, rect.strokeWidth * scale);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((rect.rotation * Math.PI) / 180);
  ctx.strokeStyle = rect.color;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "miter";
  ctx.strokeRect(-width / 2, -height / 2, width, height);
  ctx.restore();
}
