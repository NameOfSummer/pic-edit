import type { ArrowAnnotation, Point } from "./types";

export function arrowLength(arrow: Pick<ArrowAnnotation, "x1" | "y1" | "x2" | "y2">): number {
  return Math.hypot(arrow.x2 - arrow.x1, arrow.y2 - arrow.y1);
}

export function arrowHeadPoints(
  arrow: Pick<ArrowAnnotation, "x1" | "y1" | "x2" | "y2" | "strokeWidth">,
): [Point, Point, Point] {
  const dx = arrow.x2 - arrow.x1;
  const dy = arrow.y2 - arrow.y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const headLength = Math.max(12, arrow.strokeWidth * 3.2);
  const headWidth = Math.max(8, arrow.strokeWidth * 2.4);
  const baseX = arrow.x2 - ux * headLength;
  const baseY = arrow.y2 - uy * headLength;
  return [
    { x: arrow.x2, y: arrow.y2 },
    { x: baseX - uy * headWidth, y: baseY + ux * headWidth },
    { x: baseX + uy * headWidth, y: baseY - ux * headWidth },
  ];
}

/** 線分からの距離でヒット判定 */
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
  const scaled: ArrowAnnotation = {
    ...arrow,
    x1,
    y1,
    x2,
    y2,
    strokeWidth,
  };
  const [tip, left, right] = arrowHeadPoints(scaled);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  const headLength = Math.max(12, strokeWidth * 3.2);
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
