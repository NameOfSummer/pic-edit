/** キャンバス上の画像レイヤー。 */
export type ImageLayer = {
  id: string;
  src: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  /** 時計回りの回転角（度） */
  rotation: number;
};

/** 画面座標の点。 */
export type Point = {
  x: number;
  y: number;
};

/** 表示上のレイヤー矩形内でのトリミング範囲（px）。 */
export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** 画像レイヤーの部分更新。 */
export type LayerPatch = Partial<
  Pick<ImageLayer, "x" | "y" | "width" | "height" | "src" | "naturalWidth" | "naturalHeight" | "rotation">
>;

/** エディタの操作モード。 */
export type EditorTool = "select" | "arrow" | "rect" | "text" | "counter" | "mosaic" | "marker";

/** 矢印注釈（始点 → 終点）。 */
export type ArrowAnnotation = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
};

/** 矢印注釈の部分更新。 */
export type ArrowPatch = Partial<Pick<ArrowAnnotation, "x1" | "y1" | "x2" | "y2" | "color" | "strokeWidth">>;

/** 枠注釈。 */
export type RectAnnotation = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  strokeWidth: number;
};

/** 枠注釈の部分更新。 */
export type RectPatch = Partial<
  Pick<RectAnnotation, "x" | "y" | "width" | "height" | "rotation" | "color" | "strokeWidth">
>;

/** テキスト注釈。 */
export type TextAnnotation = {
  id: string;
  x: number;
  y: number;
  /** テキストボックス幅（px）。フォントサイズとは独立 */
  width: number;
  /** テキストボックス高さ（px）。フォントサイズとは独立 */
  height: number;
  text: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  color: string;
  /** 背景色。`"transparent"` でなし */
  backgroundColor: string;
  rotation: number;
};

/** テキスト注釈の部分更新。 */
export type TextPatch = Partial<
  Pick<
    TextAnnotation,
    | "x"
    | "y"
    | "width"
    | "height"
    | "text"
    | "fontSize"
    | "fontWeight"
    | "color"
    | "backgroundColor"
    | "rotation"
  >
>;

/** 新規テキストに使う色・サイズ・太さ。 */
export type TextStyle = {
  color: string;
  backgroundColor: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
};

/** テキスト描画に使うフォントファミリー。 */
export const TEXT_FONT_FAMILY = '"LINE Seed JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif';
/** テキスト色の初期値。 */
export const DEFAULT_TEXT_COLOR = "#32CD32";
/** テキスト背景色の初期値。 */
export const DEFAULT_TEXT_BACKGROUND = "#FFFFFF";
/** テキストサイズの初期値（px）。 */
export const DEFAULT_TEXT_SIZE = 32;
/** テキスト太さの初期値。 */
export const DEFAULT_TEXT_WEIGHT: TextStyle["fontWeight"] = "bold";
/** テキストサイズの選択肢（px）。 */
export const TEXT_FONT_SIZES = [16, 24, 32, 48, 64] as const;
/** 新規テキストの初期文字列。 */
export const DEFAULT_TEXT_CONTENT = "テキスト";

/**
 * 背景なしとして扱う色か判定する。
 * @param color 背景色。未指定も背景なし
 * @returns {boolean} 透明なら true
 */
export function isTransparentBackground(color: string | undefined | null): boolean {
  if (!color) {
    return true;
  }
  const normalized = color.trim().toLowerCase();
  return normalized === "transparent" || normalized === "rgba(0, 0, 0, 0)" || normalized === "rgba(0,0,0,0)";
}

/** カウンター注釈（連番の円マーカー）。 */
export type CounterAnnotation = {
  id: string;
  /** 円の中心 X */
  x: number;
  /** 円の中心 Y */
  y: number;
  value: number;
  color: string;
  size: number;
};

/** カウンター注釈の部分更新。 */
export type CounterPatch = Partial<Pick<CounterAnnotation, "x" | "y" | "value" | "color" | "size">>;

/** 新規カウンターに使う色とサイズ。 */
export type CounterStyle = {
  color: string;
  size: number;
};

/** カウンター直径の初期値（px）。 */
export const DEFAULT_COUNTER_SIZE = 36;
/** カウンター直径の選択肢（px）。 */
export const COUNTER_SIZES = [28, 36, 48] as const;

/** 矢印・枠の色の初期値。 */
export const DEFAULT_ANNOTATION_COLOR = "#32CD32";
/** 矢印・枠の太さの初期値（px）。 */
export const DEFAULT_ANNOTATION_STROKE = 4;
/** カウンター色の初期値。 */
export const DEFAULT_COUNTER_COLOR = DEFAULT_ANNOTATION_COLOR;

/** モザイク注釈。 */
export type MosaicAnnotation = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  blockSize: number;
};

/** モザイク注釈の部分更新。 */
export type MosaicPatch = Partial<
  Pick<MosaicAnnotation, "x" | "y" | "width" | "height" | "rotation" | "blockSize">
>;

/** 新規モザイクの粗さ。 */
export type MosaicStyle = {
  blockSize: number;
};

/** モザイクのブロックサイズ初期値（px）。 */
export const DEFAULT_MOSAIC_BLOCK = 12;
/** モザイク粗さの選択肢（px）。 */
export const MOSAIC_BLOCK_SIZES = [8, 12, 16, 24] as const;

/** マーカー（蛍光ペン）注釈。 */
export type MarkerAnnotation = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
};

/** マーカー注釈の部分更新。 */
export type MarkerPatch = Partial<Pick<MarkerAnnotation, "x1" | "y1" | "x2" | "y2" | "color" | "strokeWidth">>;

/** 新規マーカーの色と太さ。 */
export type MarkerStyle = {
  color: string;
  strokeWidth: number;
};

/** 蛍光ペン風カラー（描画時は半透明）。 */
export const MARKER_COLORS = [
  "#FF6B9D", // ピンク
  "#5EC8F0", // 水色
  "#7DDE6A", // 緑
  "#FFE066", // 黄
] as const;

/** マーカー太さの選択肢（px）。 */
export const MARKER_STROKE_WIDTHS = [12, 20, 28, 36] as const;
/** マーカー色の初期値。 */
export const DEFAULT_MARKER_COLOR = MARKER_COLORS[0];
/** マーカー太さの初期値（px）。 */
export const DEFAULT_MARKER_STROKE = 20;
/** マーカー描画時の不透明度。 */
export const MARKER_OPACITY = 0.45;

/**
 * 矢印色の旧名。値は DEFAULT_ANNOTATION_COLOR と同じ。
 * @deprecated 互換用
 */
export const DEFAULT_ARROW_COLOR = DEFAULT_ANNOTATION_COLOR;
/**
 * 矢印太さの旧名。値は DEFAULT_ANNOTATION_STROKE と同じ。
 * @deprecated 互換用
 */
export const DEFAULT_ARROW_STROKE = DEFAULT_ANNOTATION_STROKE;

/** 矢印・枠・カウンターで選ぶ色。 */
export const ANNOTATION_COLORS = [
  "#E60012", // 赤
  "#F39800", // 橙
  "#FFF100", // 黄
  "#32CD32", // 緑（デフォルト）
  "#1E90FF", // 青
  "#0000CD", // 藍
  "#800073", // 紫
] as const;

/** 矢印・枠の太さの選択肢（px）。 */
export const ANNOTATION_STROKE_WIDTHS = [2, 4, 6, 10] as const;

/**
 * 注釈色の旧名。値は ANNOTATION_COLORS と同じ。
 * @deprecated 互換用
 */
export const ARROW_COLORS = ANNOTATION_COLORS;
/**
 * 注釈太さの旧名。値は ANNOTATION_STROKE_WIDTHS と同じ。
 * @deprecated 互換用
 */
export const ARROW_STROKE_WIDTHS = ANNOTATION_STROKE_WIDTHS;

/** 矢印・枠の色と太さ。 */
export type AnnotationStyle = {
  color: string;
  strokeWidth: number;
};

/**
 * AnnotationStyle の旧名。
 * @deprecated 互換用
 */
export type ArrowStyle = AnnotationStyle;
