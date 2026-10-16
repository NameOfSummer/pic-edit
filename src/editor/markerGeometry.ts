import {
  MARKER_OPACITY,
  type MarkerAnnotation,
  type Point,
} from "./types";

/** マーカー端の角丸（px）。 */
export const MARKER_CORNER_RADIUS = 4;

/** マーカー線の外接矩形。 */
export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/**
 * マーカーの始点から終点までの長さを返す。
 * @param marker 始点と終点
 * @returns {number} 長さ（px）
 */
export function markerLength(marker: Pick<MarkerAnnotation, "x1" | "y1" | "x2" | "y2">): number {
  return Math.hypot(marker.x2 - marker.x1, marker.y2 - marker.y1);
}

/**
 * 線の太さを含めたマーカーの外接矩形を返す。
 * @param marker マーカー
 * @returns {Bounds} 外接矩形
 */
export function getMarkerBounds(marker: MarkerAnnotation): Bounds {
  const cx = (marker.x1 + marker.x2) / 2;
  const cy = (marker.y1 + marker.y2) / 2;
  const halfL = markerLength(marker) / 2;
  const halfH = marker.strokeWidth / 2;
  const angle = Math.atan2(marker.y2 - marker.y1, marker.x2 - marker.x1);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const locals = [
    { x: -halfL, y: -halfH },
    { x: halfL, y: -halfH },
    { x: halfL, y: halfH },
    { x: -halfL, y: halfH },
  ];
  const corners = locals.map((point) => ({
    x: cx + point.x * cos - point.y * sin,
    y: cy + point.x * sin + point.y * cos,
  }));
  const pad = 2;
  return {
    minX: Math.min(...corners.map((point) => point.x)) - pad,
    minY: Math.min(...corners.map((point) => point.y)) - pad,
    maxX: Math.max(...corners.map((point) => point.x)) + pad,
    maxY: Math.max(...corners.map((point) => point.y)) + pad,
  };
}

/**
 * 描画終了時に直線へ補正する。Shift または 45° の近傍なら角度をスナップする。
 * @param from 始点
 * @param to 終点
 * @param options Shift とスナップ許容角度。省略時は 10°
 * @returns {{ x1: number; y1: number; x2: number; y2: number }} 補正後の端点
 */
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

/**
 * マーカーの向きを度で返す。右向きが 0、時計回りが正。
 * @param marker 端点
 * @returns {number} 角度（度）
 */
export function markerAngleDegrees(marker: Pick<MarkerAnnotation, "x1" | "y1" | "x2" | "y2">): number {
  return (Math.atan2(marker.y2 - marker.y1, marker.x2 - marker.x1) * 180) / Math.PI;
}

/**
 * 中点と長さを保ったまま、指定角度へマーカーを置き直す。
 * @param marker 元のマーカー
 * @param degrees 新しい向き（度）
 * @returns {Pick<MarkerAnnotation, "x1" | "y1" | "x2" | "y2">} 回転後の端点
 */
export function placeMarkerAtAngle(
  marker: MarkerAnnotation,
  degrees: number,
): Pick<MarkerAnnotation, "x1" | "y1" | "x2" | "y2"> {
  const cx = (marker.x1 + marker.x2) / 2;
  const cy = (marker.y1 + marker.y2) / 2;
  const half = markerLength(marker) / 2;
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x1: Math.round(cx - cos * half),
    y1: Math.round(cy - sin * half),
    x2: Math.round(cx + cos * half),
    y2: Math.round(cy + sin * half),
  };
}

/**
 * 書き出しキャンバスに半透明のマーカーを描く。
 * @param ctx 描画先
 * @param marker マーカー
 * @param offsetX 書き出し原点 X
 * @param offsetY 書き出し原点 Y
 * @param scale 表示サイズに対する倍率
 * @returns {void}
 */
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
  const length = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
  const thickness = Math.max(1, marker.strokeWidth * scale);
  const radius = Math.min(MARKER_CORNER_RADIUS * scale, thickness / 2, length / 2);

  ctx.save();
  ctx.globalAlpha = MARKER_OPACITY;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = marker.color;
  ctx.translate((x1 + x2) / 2, (y1 + y2) / 2);
  ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
  ctx.beginPath();
  ctx.roundRect(-length / 2, -thickness / 2, length, thickness, radius);
  ctx.fill();
  ctx.restore();
}
