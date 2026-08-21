import type { ImageLayer, MosaicAnnotation } from "./types";
import { loadHtmlImage } from "./images";

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function rotatedCorners(mosaic: MosaicAnnotation): Array<{ x: number; y: number }> {
  const cx = mosaic.x + mosaic.width / 2;
  const cy = mosaic.y + mosaic.height / 2;
  const radians = (mosaic.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const halfW = mosaic.width / 2;
  const halfH = mosaic.height / 2;
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

export function getMosaicBounds(mosaic: MosaicAnnotation): Bounds {
  const corners = rotatedCorners(mosaic);
  return {
    minX: Math.min(...corners.map((point) => point.x)),
    minY: Math.min(...corners.map((point) => point.y)),
    maxX: Math.max(...corners.map((point) => point.x)),
    maxY: Math.max(...corners.map((point) => point.y)),
  };
}

export function pixelateCanvas(canvas: HTMLCanvasElement, blockSize: number): void {
  const width = canvas.width;
  const height = canvas.height;
  if (width < 1 || height < 1) {
    return;
  }
  const block = Math.max(2, Math.round(blockSize));
  const sw = Math.max(1, Math.ceil(width / block));
  const sh = Math.max(1, Math.ceil(height / block));
  const small = document.createElement("canvas");
  small.width = sw;
  small.height = sh;
  const smallCtx = small.getContext("2d");
  const ctx = canvas.getContext("2d");
  if (!smallCtx || !ctx) {
    return;
  }
  smallCtx.imageSmoothingEnabled = true;
  smallCtx.drawImage(canvas, 0, 0, sw, sh);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(small, 0, 0, width, height);
}

/** 書き出しキャンバス上の既存画素をモザイク化して描き戻す */
export function drawMosaicOnCanvas(
  ctx: CanvasRenderingContext2D,
  mosaic: MosaicAnnotation,
  offsetX: number,
  offsetY: number,
  scale: number,
): void {
  const width = Math.max(1, Math.round(mosaic.width * scale));
  const height = Math.max(1, Math.round(mosaic.height * scale));
  const centerX = (mosaic.x + mosaic.width / 2 - offsetX) * scale;
  const centerY = (mosaic.y + mosaic.height / 2 - offsetY) * scale;
  const block = Math.max(2, Math.round(mosaic.blockSize * scale));

  const temp = document.createElement("canvas");
  temp.width = width;
  temp.height = height;
  const tempCtx = temp.getContext("2d");
  if (!tempCtx) {
    return;
  }

  tempCtx.translate(width / 2, height / 2);
  tempCtx.rotate((-mosaic.rotation * Math.PI) / 180);
  tempCtx.translate(-centerX, -centerY);
  tempCtx.drawImage(ctx.canvas, 0, 0);
  pixelateCanvas(temp, block);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((mosaic.rotation * Math.PI) / 180);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(temp, -width / 2, -height / 2, width, height);
  ctx.restore();
}

/** 画面プレビュー用: レイヤーをモザイク矩形内に合成してピクセル化 */
export async function renderMosaicPreview(
  canvas: HTMLCanvasElement,
  mosaic: MosaicAnnotation,
  layers: ImageLayer[],
): Promise<void> {
  const width = Math.max(1, Math.round(mosaic.width));
  const height = Math.max(1, Math.round(mosaic.height));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, width, height);

  const cx = mosaic.x + mosaic.width / 2;
  const cy = mosaic.y + mosaic.height / 2;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((-mosaic.rotation * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  for (const layer of layers) {
    try {
      const image = await loadHtmlImage(layer.src);
      const layerCx = layer.x + layer.width / 2;
      const layerCy = layer.y + layer.height / 2;
      ctx.save();
      ctx.translate(layerCx, layerCy);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.drawImage(image, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
      ctx.restore();
    } catch {
      // 読み込み失敗時はスキップ
    }
  }
  ctx.restore();
  pixelateCanvas(canvas, mosaic.blockSize);
}
