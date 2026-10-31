import type { ArrowAnnotation, Point } from "./types";

/**
 * 矢印の始点から終点までの長さを返す。
 * @param arrow 始点と終点
 * @returns {number} 長さ（px）
 */
export function arrowLength(arrow: Pick<ArrowAnnotation, "x1" | "y1" | "x2" | "y2">): number {
  return Math.hypot(arrow.x2 - arrow.x1, arrow.y2 - arrow.y1);
}

/** 頭部が太さに比例して大きくなる上限の太さ（px）。これより太いと伸び方を緩める。 */
const HEAD_LINEAR_LIMIT = 10;

/**
 * 太さに応じた矢印頭部の長さを返す。
 * 10px までは太さ×3.2、それより太い分は×2 で伸ばし、太い矢印の頭が大きくなりすぎないようにする。
 * @param strokeWidth 線の太さ（px）
 * @returns {number} 頭部の長さ（px）
 */
export function arrowHeadLength(strokeWidth: number): number {
  if (strokeWidth <= HEAD_LINEAR_LIMIT) {
    return Math.max(12, strokeWidth * 3.2);
  }
  return HEAD_LINEAR_LIMIT * 3.2 + (strokeWidth - HEAD_LINEAR_LIMIT) * 2;
}

/**
 * 太さに応じた矢印頭部の半幅（中心線から片側の幅）を返す。
 * 10px までは太さ×2.4、それより太い分は×1.5 で伸ばす。
 * @param strokeWidth 線の太さ（px）
 * @returns {number} 頭部の半幅（px）
 */
export function arrowHeadHalfWidth(strokeWidth: number): number {
  if (strokeWidth <= HEAD_LINEAR_LIMIT) {
    return Math.max(8, strokeWidth * 2.4);
  }
  return HEAD_LINEAR_LIMIT * 2.4 + (strokeWidth - HEAD_LINEAR_LIMIT) * 1.5;
}

/**
 * 矢印頭部の先端と左右の底点を返す。
 * @param arrow 始点・終点・太さ
 * @returns {[Point, Point, Point]} 先端、左、右
 */
export function arrowHeadPoints(
  arrow: Pick<ArrowAnnotation, "x1" | "y1" | "x2" | "y2" | "strokeWidth">,
): [Point, Point, Point] {
  const dx = arrow.x2 - arrow.x1;
  const dy = arrow.y2 - arrow.y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const headLength = arrowHeadLength(arrow.strokeWidth);
  const headWidth = arrowHeadHalfWidth(arrow.strokeWidth);
  const baseX = arrow.x2 - ux * headLength;
  const baseY = arrow.y2 - uy * headLength;
  return [
    { x: arrow.x2, y: arrow.y2 },
    { x: baseX - uy * headWidth, y: baseY + ux * headWidth },
    { x: baseX + uy * headWidth, y: baseY - ux * headWidth },
  ];
}

/**
 * 点が矢印の線の近くにあるか判定する。
 * @param arrow 判定する矢印
 * @param point 画面上の点
 * @param tolerance 線からの許容距離（px）
 * @returns {boolean} 当たっていれば true
 */
export function hitTestArrow(arrow: ArrowAnnotation, point: Point, tolerance = 8): boolean {
  const { x1, y1, x2, y2 } = arrow;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) {
    return Math.hypot(point.x - x1, point.y - y1) <= tolerance + arrow.strokeWidth;
  }
  const t = Math.max(0, Math.min(1, ((point.x - x1) * dx + (point.y - y1) * dy) / lengthSq));
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  return Math.hypot(point.x - closestX, point.y - closestY) <= tolerance + arrow.strokeWidth / 2;
}

/**
 * 書き出しキャンバスに矢印を描く。
 * @param ctx 描画先
 * @param arrow 矢印
 * @param offsetX 書き出し原点 X
 * @param offsetY 書き出し原点 Y
 * @param scale 表示サイズに対する倍率
 * @returns {void}
 */
export function drawArrowOnCanvas(
  ctx: CanvasRenderingContext2D,
  arrow: ArrowAnnotation,
  offsetX: number,
  offsetY: number,
  scale: number,
): void {
  const x1 = (arrow.x1 - offsetX) * scale;
  const y1 = (arrow.y1 - offsetY) * scale;
  const x2 = (arrow.x2 - offsetX) * scale;
  const y2 = (arrow.y2 - offsetY) * scale;
  const strokeWidth = Math.max(1, arrow.strokeWidth * scale);
  // 頭部は画面上の座標で求めてから倍率をかける（画面表示と形を一致させるため）
  const [tip, left, right] = arrowHeadPoints(arrow).map((point) => ({
    x: (point.x - offsetX) * scale,
    y: (point.y - offsetY) * scale,
  }));
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  const headLength = arrowHeadLength(arrow.strokeWidth) * scale;
  const shaftEndX = x1 + (dx / length) * Math.max(0, length - headLength * 0.85);
  const shaftEndY = y1 + (dy / length) * Math.max(0, length - headLength * 0.85);

  ctx.save();
  ctx.strokeStyle = arrow.color;
  ctx.fillStyle = arrow.color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
