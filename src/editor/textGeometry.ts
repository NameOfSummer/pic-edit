import {
  TEXT_FONT_FAMILY,
  isTransparentBackground,
  type TextAnnotation,
} from "./types";

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export const MIN_TEXT_BOX_WIDTH = 40;
export const MIN_TEXT_BOX_HEIGHT = 24;

function fontCss(text: Pick<TextAnnotation, "fontSize" | "fontWeight">): string {
  return `${text.fontWeight === "bold" ? "700" : "400"} ${text.fontSize}px ${TEXT_FONT_FAMILY}`;
}

/** 折り返しなしのテキスト固有サイズを測る（新規作成時の初期ボックス用） */
export function measureTextBox(text: Pick<TextAnnotation, "text" | "fontSize" | "fontWeight">): {
  width: number;
  height: number;
} {
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
    width: Math.max(MIN_TEXT_BOX_WIDTH, Math.ceil(width)),
    height: Math.max(MIN_TEXT_BOX_HEIGHT, Math.ceil(lines.length * lineHeight)),
  };
}

/** 指定幅で折り返した行を返す */
export function wrapTextLines(
  text: Pick<TextAnnotation, "text" | "fontSize" | "fontWeight">,
  maxWidth: number,
): string[] {
  const paragraphs = text.text.length > 0 ? text.text.split("\n") : [""];
  if (typeof document === "undefined") {
    return paragraphs;
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return paragraphs;
  }
  ctx.font = fontCss(text);
  const width = Math.max(1, maxWidth);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const char of paragraph) {
      const next = current + char;
      if (current.length > 0 && ctx.measureText(next).width > width) {
        lines.push(current);
        current = char;
      } else {
        current = next;
      }
    }
    lines.push(current);
  }
  return lines.length > 0 ? lines : [""];
}

export function getTextBoxSize(text: TextAnnotation): { width: number; height: number } {
  if (!(text.width > 0) || !(text.height > 0)) {
    return measureTextBox(text);
  }
  return {
    width: Math.max(MIN_TEXT_BOX_WIDTH, text.width),
    height: Math.max(MIN_TEXT_BOX_HEIGHT, text.height),
  };
}

export function getTextBounds(text: TextAnnotation): Bounds {
  const box = getTextBoxSize(text);
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

/** 画面上の移動量を、回転前のローカル座標の移動量に変換する */
export { screenDeltaToLocal } from "./boxResize";

export function drawTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  text: TextAnnotation,
  offsetX: number,
  offsetY: number,
  scale: number,
): void {
  const box = getTextBoxSize(text);
  const centerX = (text.x + box.width / 2 - offsetX) * scale;
  const centerY = (text.y + box.height / 2 - offsetY) * scale;
  const fontSize = text.fontSize * scale;
  const lineHeight = fontSize * 1.25;
  const drawWidth = box.width * scale;
  const drawHeight = box.height * scale;
  const lines = wrapTextLines(text, box.width);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((text.rotation * Math.PI) / 180);
  ctx.beginPath();
  ctx.rect(-drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.clip();
  if (text.backgroundColor && !isTransparentBackground(text.backgroundColor)) {
    ctx.fillStyle = text.backgroundColor;
    ctx.fillRect(-drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  }
  ctx.fillStyle = text.color;
  ctx.font = `${text.fontWeight === "bold" ? "700" : "400"} ${fontSize}px ${TEXT_FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  let y = -drawHeight / 2;
  for (const line of lines) {
    if (y > drawHeight / 2) {
      break;
    }
    ctx.fillText(line, -drawWidth / 2, y);
    y += lineHeight;
  }
  ctx.restore();
}
