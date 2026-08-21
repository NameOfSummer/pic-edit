import type { RectAnnotation } from "./types";

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

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
