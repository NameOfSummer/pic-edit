import {
  MARKER_OPACITY,
  type MarkerAnnotation,
  type Point,
} from "./types";

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function markerLength(marker: Pick<MarkerAnnotation, "x1" | "y1" | "x2" | "y2">): number {
  return Math.hypot(marker.x2 - marker.x1, marker.y2 - marker.y1);
}

export function getMarkerBounds(marker: MarkerAnnotation): Bounds {
  const pad = marker.strokeWidth / 2 + 2;
  return {
    minX: Math.min(marker.x1, marker.x2) - pad,
    minY: Math.min(marker.y1, marker.y2) - pad,
    maxX: Math.max(marker.x1, marker.x2) + pad,
    maxY: Math.max(marker.y1, marker.y2) + pad,
  };
}

/** 描画終了時に直線へ補正。Shift または 45° 近傍なら角度スナップ */
export function straightenMarkerLine(
  from: Point,
  to: Point,
  options?: { shiftKey?: boolean; snapThresholdDeg?: number },
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) {
    return {
      x1: Math.round(from.x),
      y1: Math.round(from.y),
      x2: Math.round(from.x + 1),
      y2: Math.round(from.y),
    };
  }

  let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const threshold = options?.snapThresholdDeg ?? 10;
  const snapped = Math.round(angleDeg / 45) * 45;
  const delta = Math.abs(((angleDeg - snapped + 540) % 360) - 180);
  if (options?.shiftKey || delta <= threshold) {
    angleDeg = snapped;
  }

  const radians = (angleDeg * Math.PI) / 180;
  return {
    x1: Math.round(from.x),
    y1: Math.round(from.y),
    x2: Math.round(from.x + Math.cos(radians) * length),
    y2: Math.round(from.y + Math.sin(radians) * length),
  };
}

export function rotateMarkerEndpoints(
  marker: MarkerAnnotation,
  degreesDelta: number,
): Pick<MarkerAnnotation, "x1" | "y1" | "x2" | "y2"> {
  const cx = (marker.x1 + marker.x2) / 2;
  const cy = (marker.y1 + marker.y2) / 2;
  const radians = (degreesDelta * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const rotate = (x: number, y: number) => {
    const dx = x - cx;
    const dy = y - cy;
    return {
      x: Math.round(cx + dx * cos - dy * sin),
      y: Math.round(cy + dx * sin + dy * cos),
    };
  };

  const p1 = rotate(marker.x1, marker.y1);
  const p2 = rotate(marker.x2, marker.y2);
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

export function drawMarkerOnCanvas(
  ctx: CanvasRenderingContext2D,
  marker: MarkerAnnotation,
  offsetX: number,
  offsetY: number,
  scale: number,
): void {
  const x1 = (marker.x1 - offsetX) * scale;
  const y1 = (marker.y1 - offsetY) * scale;
  const x2 = (marker.x2 - offsetX) * scale;
  const y2 = (marker.y2 - offsetY) * scale;
  const width = Math.max(1, marker.strokeWidth * scale);

  ctx.save();
  ctx.globalAlpha = MARKER_OPACITY;
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = marker.color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
