import { TEXT_FONT_FAMILY, type CounterAnnotation } from "./types";

/** カウンター円の外接矩形。 */
export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/**
 * カウンター円の外接矩形を返す。
 * @param counter カウンター
 * @returns {Bounds} 外接矩形
 */
export function getCounterBounds(counter: CounterAnnotation): Bounds {
  const radius = counter.size / 2;
  return {
    minX: counter.x - radius,
    minY: counter.y - radius,
    maxX: counter.x + radius,
    maxY: counter.y + radius,
  };
}

/**
 * 背景色に対して読みやすい数字色を返す。
 * @param background 円の塗り色
 * @returns {string} `#111111` または `#FFFFFF`
 */
export function counterLabelColor(background: string): string {
  const hex = background.replace("#", "");
  if (hex.length !== 6) {
    return "#FFFFFF";
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.72 ? "#111111" : "#FFFFFF";
}

/**
 * 書き出しキャンバスにカウンターを描く。
 * @param ctx 描画先
 * @param counter カウンター
 * @param offsetX 書き出し原点 X
 * @param offsetY 書き出し原点 Y
 * @param scale 表示サイズに対する倍率
 * @returns {void}
 */
export function drawCounterOnCanvas(
  ctx: CanvasRenderingContext2D,
  counter: CounterAnnotation,
  offsetX: number,
  offsetY: number,
  scale: number,
): void {
  const cx = (counter.x - offsetX) * scale;
  const cy = (counter.y - offsetY) * scale;
  const radius = (counter.size / 2) * scale;
  const label = String(counter.value);
  const fontSize = Math.max(10, counter.size * 0.48 * scale);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = counter.color;
  ctx.fill();

  ctx.fillStyle = counterLabelColor(counter.color);
  ctx.font = `700 ${fontSize}px ${TEXT_FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy + fontSize * 0.04);
  ctx.restore();
}
