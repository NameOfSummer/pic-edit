import type { ImageLayer, Point } from "./types";

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
  const fromItems = collectImageFiles(clipboardData?.items ?? null);
  if (fromItems.length > 0) {
    return fromItems;
  }

  const fromFiles = collectImageFiles(clipboardData?.files ?? null);
  if (fromFiles.length > 0) {
    return fromFiles;
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

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
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
    });
  }

  return layers;
}
