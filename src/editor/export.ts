import { drawArrowOnCanvas } from "./arrowGeometry";
import { drawCounterOnCanvas, getCounterBounds } from "./counterGeometry";
import { drawMarkerOnCanvas, getMarkerBounds } from "./markerGeometry";
import { drawMosaicOnCanvas, getMosaicBounds } from "./mosaicGeometry";
import { drawRectOnCanvas, getRectBounds } from "./rectGeometry";
import { drawTextOnCanvas, getTextBounds } from "./textGeometry";
import { loadHtmlImage } from "./images";
import type {
  ArrowAnnotation,
  CounterAnnotation,
  ImageLayer,
  MarkerAnnotation,
  MosaicAnnotation,
  RectAnnotation,
  TextAnnotation,
} from "./types";

/** 書き出し画像の周囲に足す余白（px）。 */
export const EXPORT_PADDING_PX = 12;

/** 画面座標での外接矩形。 */
export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/** 書き出し対象の画像と注釈。注釈は省略できる。 */
export type SceneDocument = {
  layers: ImageLayer[];
  arrows?: ArrowAnnotation[];
  rects?: RectAnnotation[];
  texts?: TextAnnotation[];
  counters?: CounterAnnotation[];
  mosaics?: MosaicAnnotation[];
  markers?: MarkerAnnotation[];
};

/**
 * 回転後の画像四隅を返す。
 * @param layer 画像レイヤー
 * @returns {Array<{ x: number; y: number }>} 四隅
 */
function rotatedCorners(layer: ImageLayer): Array<{ x: number; y: number }> {
  const cx = layer.x + layer.width / 2;
  const cy = layer.y + layer.height / 2;
  const radians = (layer.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const halfW = layer.width / 2;
  const halfH = layer.height / 2;
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
 * 回転を含めた画像の外接矩形を返す。
 * @param layer 画像レイヤー
 * @returns {Bounds} 外接矩形
 */
export function getLayerBounds(layer: ImageLayer): Bounds {
  const corners = rotatedCorners(layer);
  return {
    minX: Math.min(...corners.map((point) => point.x)),
    minY: Math.min(...corners.map((point) => point.y)),
    maxX: Math.max(...corners.map((point) => point.x)),
    maxY: Math.max(...corners.map((point) => point.y)),
  };
}

/**
 * 矢印の頭を含むおおまかな外接矩形を返す。
 * @param arrow 矢印
 * @returns {Bounds} 外接矩形
 */
function getArrowBounds(arrow: ArrowAnnotation): Bounds {
  const pad = arrow.strokeWidth * 4;
  return {
    minX: Math.min(arrow.x1, arrow.x2) - pad,
    minY: Math.min(arrow.y1, arrow.y2) - pad,
    maxX: Math.max(arrow.x1, arrow.x2) + pad,
    maxY: Math.max(arrow.y1, arrow.y2) + pad,
  };
}

/**
 * 画像と注釈をすべて含む、余白つきの外接矩形を返す。
 * @param layers 画像
 * @param arrows 矢印
 * @param rects 枠
 * @param texts テキスト
 * @param counters カウンター
 * @param mosaics モザイク
 * @param markers マーカー
 * @param padding 周囲の余白（px）
 * @returns {Bounds | null} 中身が空なら null
 */
export function getExportBounds(
  layers: ImageLayer[],
  arrows: ArrowAnnotation[] = [],
  rects: RectAnnotation[] = [],
  texts: TextAnnotation[] = [],
  counters: CounterAnnotation[] = [],
  mosaics: MosaicAnnotation[] = [],
  markers: MarkerAnnotation[] = [],
  padding = EXPORT_PADDING_PX,
): Bounds | null {
  if (
    layers.length === 0 &&
    arrows.length === 0 &&
    rects.length === 0 &&
    texts.length === 0 &&
    counters.length === 0 &&
    mosaics.length === 0 &&
    markers.length === 0
  ) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const layer of layers) {
    const bounds = getLayerBounds(layer);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  for (const arrow of arrows) {
    const bounds = getArrowBounds(arrow);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  for (const rect of rects) {
    const bounds = getRectBounds(rect);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  for (const text of texts) {
    const bounds = getTextBounds(text);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  for (const counter of counters) {
    const bounds = getCounterBounds(counter);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  for (const mosaic of mosaics) {
    const bounds = getMosaicBounds(mosaic);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  for (const marker of markers) {
    const bounds = getMarkerBounds(marker);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  return {
    minX: Math.floor(minX) - padding,
    minY: Math.floor(minY) - padding,
    maxX: Math.ceil(maxX) + padding,
    maxY: Math.ceil(maxY) + padding,
  };
}

/**
 * 各レイヤーの元解像度と表示サイズの比の最大値を返す。
 * @param layers 画像
 * @returns {number} 1 以上の倍率
 */
export function getExportScale(layers: ImageLayer[]): number {
  let scale = 1;
  for (const layer of layers) {
    if (layer.width > 0 && layer.height > 0) {
      scale = Math.max(scale, layer.naturalWidth / layer.width, layer.naturalHeight / layer.height);
    }
  }
  return scale;
}

/**
 * キャンバスを PNG の Blob にする。
 * @param canvas 書き出し元
 * @returns {Promise<Blob>} PNG
 */
function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("PNG の書き出しに失敗しました"));
      }
    }, "image/png");
  });
}

/**
 * 省略された注釈配列を空配列で埋める。
 * @param doc シーン
 * @returns {Required<SceneDocument>} 注釈が必ず配列のシーン
 */
function normalizeScene(doc: SceneDocument) {
  return {
    layers: doc.layers,
    arrows: doc.arrows ?? [],
    rects: doc.rects ?? [],
    texts: doc.texts ?? [],
    counters: doc.counters ?? [],
    mosaics: doc.mosaics ?? [],
    markers: doc.markers ?? [],
  };
}

/**
 * 画面表示と同じ重ね順でシーンをオフスクリーン合成する。市松は描かず透明背景。
 * @param doc 画像と注釈
 * @param options 倍率と余白。省略時は元解像度相当と既定余白
 * @returns {Promise<{ canvas: HTMLCanvasElement; bounds: Bounds } | null>} 中身が空なら null
 */
export async function renderSceneToCanvas(
  doc: SceneDocument,
  options: { scale?: number; padding?: number } = {},
): Promise<{ canvas: HTMLCanvasElement; bounds: Bounds } | null> {
  const scene = normalizeScene(doc);
  const padding = options.padding ?? EXPORT_PADDING_PX;
  const bounds = getExportBounds(
    scene.layers,
    scene.arrows,
    scene.rects,
    scene.texts,
    scene.counters,
    scene.mosaics,
    scene.markers,
    padding,
  );
  if (!bounds) {
    return null;
  }

  const scale = options.scale ?? getExportScale(scene.layers);
  const width = Math.max(1, Math.round((bounds.maxX - bounds.minX) * scale));
  const height = Math.max(1, Math.round((bounds.maxY - bounds.minY) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas を初期化できませんでした");
  }

  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if ((scene.texts.length > 0 || scene.counters.length > 0) && "fonts" in document) {
    await document.fonts.ready;
  }

  for (const layer of scene.layers) {
    const image = await loadHtmlImage(layer.src);
    const centerX = (layer.x + layer.width / 2 - bounds.minX) * scale;
    const centerY = (layer.y + layer.height / 2 - bounds.minY) * scale;
    const drawWidth = layer.width * scale;
    const drawHeight = layer.height * scale;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }

  // Editor の DOM 重ね順に合わせる（下→上）
  for (const mosaic of scene.mosaics) {
    drawMosaicOnCanvas(ctx, mosaic, bounds.minX, bounds.minY, scale);
  }
  for (const arrow of scene.arrows) {
    drawArrowOnCanvas(ctx, arrow, bounds.minX, bounds.minY, scale);
  }
  for (const rect of scene.rects) {
    drawRectOnCanvas(ctx, rect, bounds.minX, bounds.minY, scale);
  }
  for (const text of scene.texts) {
    drawTextOnCanvas(ctx, text, bounds.minX, bounds.minY, scale);
  }
  for (const counter of scene.counters) {
    drawCounterOnCanvas(ctx, counter, bounds.minX, bounds.minY, scale);
  }
  for (const marker of scene.markers) {
    drawMarkerOnCanvas(ctx, marker, bounds.minX, bounds.minY, scale);
  }

  return { canvas, bounds };
}

/**
 * 透明背景・元解像度相当の PNG を作る。市松模様は描かない。
 * @param layers 画像
 * @param arrows 矢印
 * @param rects 枠
 * @param texts テキスト
 * @param counters カウンター
 * @param mosaics モザイク
 * @param markers マーカー
 * @returns {Promise<Blob>} PNG
 */
export async function renderLayersToPngBlob(
  layers: ImageLayer[],
  arrows: ArrowAnnotation[] = [],
  rects: RectAnnotation[] = [],
  texts: TextAnnotation[] = [],
  counters: CounterAnnotation[] = [],
  mosaics: MosaicAnnotation[] = [],
  markers: MarkerAnnotation[] = [],
): Promise<Blob> {
  const rendered = await renderSceneToCanvas(
    { layers, arrows, rects, texts, counters, mosaics, markers },
    { scale: getExportScale(layers), padding: EXPORT_PADDING_PX },
  );
  if (!rendered) {
    throw new Error("書き出す画像がありません");
  }
  return canvasToPngBlob(rendered.canvas);
}

/**
 * 書き出しファイル名を `pic_YYMMDDHHmmss.png` にする。
 * @param date 使う日時
 * @returns {string} ファイル名
 */
export function formatExportFilename(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `pic_${yy}${mm}${dd}${hh}${mi}${ss}.png`;
}

/**
 * シーンを PNG としてダウンロードする。
 * @param layers 画像
 * @param arrows 矢印
 * @param rects 枠
 * @param texts テキスト
 * @param counters カウンター
 * @param mosaics モザイク
 * @param markers マーカー
 * @param filename 保存名
 * @returns {Promise<void>}
 */
export async function downloadLayersAsPng(
  layers: ImageLayer[],
  arrows: ArrowAnnotation[] = [],
  rects: RectAnnotation[] = [],
  texts: TextAnnotation[] = [],
  counters: CounterAnnotation[] = [],
  mosaics: MosaicAnnotation[] = [],
  markers: MarkerAnnotation[] = [],
  filename = formatExportFilename(),
): Promise<void> {
  const blob = await renderLayersToPngBlob(layers, arrows, rects, texts, counters, mosaics, markers);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * シーンの PNG をクリップボードへコピーする。
 * @param layers 画像
 * @param arrows 矢印
 * @param rects 枠
 * @param texts テキスト
 * @param counters カウンター
 * @param mosaics モザイク
 * @param markers マーカー
 * @returns {Promise<void>}
 */
export async function copyLayersAsPng(
  layers: ImageLayer[],
  arrows: ArrowAnnotation[] = [],
  rects: RectAnnotation[] = [],
  texts: TextAnnotation[] = [],
  counters: CounterAnnotation[] = [],
  mosaics: MosaicAnnotation[] = [],
  markers: MarkerAnnotation[] = [],
): Promise<void> {
  const blob = await renderLayersToPngBlob(layers, arrows, rects, texts, counters, mosaics, markers);
  if (!navigator.clipboard?.write) {
    throw new Error("このブラウザでは画像のコピーに対応していません");
  }
  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": Promise.resolve(blob),
    }),
  ]);
}
