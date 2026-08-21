import type { CropRect, ImageLayer, Point } from "./types";

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
]);

export function isImageFile(file: File): boolean {
  if (IMAGE_TYPES.has(file.type)) {
    return true;
  }
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name);
}

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

/** paste イベントの DataTransfer だけを見る（システムクリップボードの古い画像は拾わない） */
export function collectClipboardImagesFromEvent(clipboardData: DataTransfer | null): File[] {
  const fromItems = collectImageFiles(clipboardData?.items ?? null);
  if (fromItems.length > 0) {
    return fromItems;
  }
  return collectImageFiles(clipboardData?.files ?? null);
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    image.src = src;
  });
}

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

/** 表示矩形上の crop を元画像座標に写し、切り出した画像を返す */
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
