import type { CropRect, ImageLayer, Point } from "./types";

/** 画像として受け付ける MIME タイプ。 */
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
]);

/**
 * ファイルが画像か判定する。
 * @param file 判定するファイル
 * @returns {boolean} 画像なら true
 */
export function isImageFile(file: File): boolean {
  if (IMAGE_TYPES.has(file.type)) {
    return true;
  }
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name);
}

/**
 * ファイル一覧から画像だけを集める。
 * @param files 入力。なければ空
 * @returns {File[]} 画像ファイル
 */
export function collectImageFiles(files: FileList | File[] | DataTransferItemList | null): File[] {
  if (!files) {
    return [];
  }

  const collected: File[] = [];

  if (files instanceof DataTransferItemList) {
    for (let i = 0; i < files.length; i += 1) {
      const item = files[i];
      if (item?.kind === "file") {
        const file = item.getAsFile();
        if (file && isImageFile(file)) {
          collected.push(file);
        }
      }
    }
    return collected;
  }

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    if (file && isImageFile(file)) {
      collected.push(file);
    }
  }
  return collected;
}

/**
 * 貼り付けデータ、なければシステムクリップボードから画像を集める。
 * @param clipboardData paste イベントの DataTransfer
 * @returns {Promise<File[]>} 画像ファイル。読めなければ空
 */
export async function collectClipboardImages(clipboardData: DataTransfer | null): Promise<File[]> {
  const fromEvent = collectClipboardImagesFromEvent(clipboardData);
  if (fromEvent.length > 0) {
    return fromEvent;
  }

  if (!navigator.clipboard?.read) {
    return [];
  }

  try {
    const items = await navigator.clipboard.read();
    const files: File[] = [];
    for (const item of items) {
      const type = item.types.find((candidate) => candidate.startsWith("image/"));
      if (!type) {
        continue;
      }
      const blob = await item.getType(type);
      const extension = type.split("/")[1] ?? "png";
      files.push(new File([blob], `paste.${extension}`, { type }));
    }
    return files;
  } catch {
    return [];
  }
}

/**
 * paste イベントの DataTransfer だけを見る。システムクリップボードの古い画像は拾わない。
 * @param clipboardData paste イベントの DataTransfer
 * @returns {File[]} そのイベントに含まれていた画像
 */
export function collectClipboardImagesFromEvent(clipboardData: DataTransfer | null): File[] {
  const fromItems = collectImageFiles(clipboardData?.items ?? null);
  if (fromItems.length > 0) {
    return fromItems;
  }
  return collectImageFiles(clipboardData?.files ?? null);
}

/**
 * URL から HTMLImageElement を読み込む。
 * @param src 画像 URL
 * @returns {Promise<HTMLImageElement>} 読み込み済みの画像
 */
export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    image.src = src;
  });
}

/**
 * 縦横比を保ったまま、指定サイズに収まる表示サイズを返す。
 * @param naturalWidth 元の幅
 * @param naturalHeight 元の高さ
 * @param maxWidth 表示の最大幅
 * @param maxHeight 表示の最大高さ
 * @returns {{ width: number; height: number }} 収めたサイズ
 */
export function fitSize(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight);
  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  };
}

/**
 * キャンバスを PNG の object URL にする。
 * @param canvas 書き出し元
 * @returns {Promise<string>} object URL
 */
async function canvasToObjectUrl(canvas: HTMLCanvasElement): Promise<string> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("画像の書き出しに失敗しました"));
      }
    }, "image/png");
  });
  return URL.createObjectURL(blob);
}

/**
 * 表示矩形上の crop を元画像座標に写し、切り出した画像を返す。
 * @param layer 切り出すレイヤー
 * @param crop 表示座標での範囲
 * @returns {Promise<{ src: string; naturalWidth: number; naturalHeight: number; width: number; height: number }>} 切り出し結果
 */
export async function cropImageSrc(
  layer: ImageLayer,
  crop: CropRect,
): Promise<{ src: string; naturalWidth: number; naturalHeight: number; width: number; height: number }> {
  const image = await loadHtmlImage(layer.src);
  const scaleX = layer.naturalWidth / layer.width;
  const scaleY = layer.naturalHeight / layer.height;

  const sourceX = Math.max(0, Math.round(crop.x * scaleX));
  const sourceY = Math.max(0, Math.round(crop.y * scaleY));
  const sourceWidth = Math.max(1, Math.round(crop.width * scaleX));
  const sourceHeight = Math.max(1, Math.round(crop.height * scaleY));

  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas を初期化できませんでした");
  }

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

  return {
    src: await canvasToObjectUrl(canvas),
    naturalWidth: sourceWidth,
    naturalHeight: sourceHeight,
    width: Math.max(1, Math.round(crop.width)),
    height: Math.max(1, Math.round(crop.height)),
  };
}

/**
 * 画像ファイルを、ビューポートに収まるレイヤーにする。
 * @param files 配置する画像
 * @param origin 最初のレイヤーの左上
 * @param viewport 画面サイズ。収める上限に使う
 * @returns {Promise<ImageLayer[]>} 新しいレイヤー
 */
export async function filesToLayers(files: File[], origin: Point, viewport: Point): Promise<ImageLayer[]> {
  const maxWidth = Math.max(160, viewport.x * 0.72);
  const maxHeight = Math.max(160, viewport.y * 0.72);
  const layers: ImageLayer[] = [];

  for (const [index, file] of files.entries()) {
    const src = URL.createObjectURL(file);
    const image = await loadHtmlImage(src);
    const size = fitSize(image.naturalWidth, image.naturalHeight, maxWidth, maxHeight);
    const offset = index * 28;

    layers.push({
      id: crypto.randomUUID(),
      src,
      name: file.name || "image",
      x: Math.round(origin.x - size.width / 2 + offset),
      y: Math.round(origin.y - size.height / 2 + offset),
      width: size.width,
      height: size.height,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      rotation: 0,
    });
  }

  return layers;
}
