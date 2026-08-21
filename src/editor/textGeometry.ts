import {
  TEXT_FONT_FAMILY,
  type TextAnnotation,
} from "./types";

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function fontCss(text: Pick<TextAnnotation, "fontSize" | "fontWeight">): string {
  return `${text.fontWeight === "bold" ? "700" : "400"} ${text.fontSize}px ${TEXT_FONT_FAMILY}`;
}

/** 未回転時のテキスト表示サイズを測る */
export function measureTextBox(text: TextAnnotation): { width: number; height: number } {
  if (typeof document === "undefined") {
    const lines = text.text.split("\n");
    return {
      width: Math.max(1, ...lines.map((line) => line.length)) * text.fontSize * 0.6,
      height: Math.max(1, lines.length) * text.fontSize * 1.25,
    };
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { width: text.fontSize * 4, height: text.fontSize * 1.25 };
  }
  ctx.font = fontCss(text);
  const lines = text.text.length > 0 ? text.text.split("\n") : [" "];
  let width = 0;
  for (const line of lines) {
    width = Math.max(width, ctx.measureText(line || " ").width);
  }
  const lineHeight = text.fontSize * 1.25;
  return {
    width: Math.max(1, Math.ceil(width)),
    height: Math.max(1, Math.ceil(lines.length * lineHeight)),
  };
}

export function getTextBounds(text: TextAnnotation): Bounds {
  const box = measureTextBox(text);
  const cx = text.x + box.width / 2;
  const cy = text.y + box.height / 2;
  const radians = (text.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const halfW = box.width / 2;
  const halfH = box.height / 2;
  const locals = [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH },
  ];
  const corners = locals.map((point) => ({
    x: cx + point.x * cos - point.y * sin,
    y: cy + point.x * sin + point.y * cos,
  }));
  return {
    minX: Math.min(...corners.map((point) => point.x)),
    minY: Math.min(...corners.map((point) => point.y)),
    maxX: Math.max(...corners.map((point) => point.x)),
    maxY: Math.max(...corners.map((point) => point.y)),
  };
}

export function drawTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  text: TextAnnotation,
  offsetX: number,
  offsetY: number,
  scale: number,
): void {
  const box = measureTextBox(text);
  const centerX = (text.x + box.width / 2 - offsetX) * scale;
  const centerY = (text.y + box.height / 2 - offsetY) * scale;
  const fontSize = text.fontSize * scale;
  const lineHeight = fontSize * 1.25;
  const lines = text.text.length > 0 ? text.text.split("\n") : [""];

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((text.rotation * Math.PI) / 180);
  ctx.fillStyle = text.color;
  ctx.font = `${text.fontWeight === "bold" ? "700" : "400"} ${fontSize}px ${TEXT_FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const drawWidth = box.width * scale;
  const drawHeight = box.height * scale;
  let y = -drawHeight / 2;
  for (const line of lines) {
    ctx.fillText(line, -drawWidth / 2, y);
    y += lineHeight;
  }
  ctx.restore();
}
