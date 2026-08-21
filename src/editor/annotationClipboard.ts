import type {
  ArrowAnnotation,
  CounterAnnotation,
  MarkerAnnotation,
  MosaicAnnotation,
  RectAnnotation,
  TextAnnotation,
} from "./types";

export const ANNOTATION_PASTE_OFFSET = 24;

export type AnnotationClipboard =
  | { kind: "arrow"; data: Omit<ArrowAnnotation, "id"> }
  | { kind: "rect"; data: Omit<RectAnnotation, "id"> }
  | { kind: "text"; data: Omit<TextAnnotation, "id"> }
  | { kind: "counter"; data: Omit<CounterAnnotation, "id"> }
  | { kind: "mosaic"; data: Omit<MosaicAnnotation, "id"> }
  | { kind: "marker"; data: Omit<MarkerAnnotation, "id"> };

export function shiftAnnotationClipboard(
  clip: AnnotationClipboard,
  offset = ANNOTATION_PASTE_OFFSET,
): AnnotationClipboard {
  switch (clip.kind) {
    case "arrow":
      return {
        kind: "arrow",
        data: {
          ...clip.data,
          x1: clip.data.x1 + offset,
          y1: clip.data.y1 + offset,
          x2: clip.data.x2 + offset,
          y2: clip.data.y2 + offset,
        },
      };
    case "rect":
      return {
        kind: "rect",
        data: {
          ...clip.data,
          x: clip.data.x + offset,
          y: clip.data.y + offset,
        },
      };
    case "text":
      return {
        kind: "text",
        data: {
          ...clip.data,
          x: clip.data.x + offset,
          y: clip.data.y + offset,
        },
      };
    case "counter":
      return {
        kind: "counter",
        data: {
          ...clip.data,
          x: clip.data.x + offset,
          y: clip.data.y + offset,
        },
      };
    case "mosaic":
      return {
        kind: "mosaic",
        data: {
          ...clip.data,
          x: clip.data.x + offset,
          y: clip.data.y + offset,
        },
      };
    case "marker":
      return {
        kind: "marker",
        data: {
          ...clip.data,
          x1: clip.data.x1 + offset,
          y1: clip.data.y1 + offset,
          x2: clip.data.x2 + offset,
          y2: clip.data.y2 + offset,
        },
      };
  }
}

export function omitAnnotationId<T extends { id: string }>(item: T): Omit<T, "id"> {
  const { id: _id, ...rest } = item;
  return rest;
}
