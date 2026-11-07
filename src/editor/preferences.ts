import { EXPORT_PADDING_PX } from "@/editor/export";
import {
  ANNOTATION_STROKE_MAX,
  ANNOTATION_STROKE_MIN,
  COUNTER_SIZES,
  DEFAULT_ANNOTATION_COLOR,
  DEFAULT_ANNOTATION_STROKE,
  DEFAULT_COUNTER_COLOR,
  DEFAULT_COUNTER_SIZE,
  DEFAULT_EXPORT_BACKGROUND,
  DEFAULT_MARKER_COLOR,
  DEFAULT_MARKER_STROKE,
  DEFAULT_MOSAIC_BLOCK,
  DEFAULT_TEXT_BACKGROUND,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_SIZE,
  DEFAULT_TEXT_WEIGHT,
  EXPORT_PADDING_MAX,
  EXPORT_PADDING_MIN,
  MARKER_STROKE_WIDTHS,
  MOSAIC_BLOCK_SIZES,
  TEXT_FONT_SIZES,
  type AnnotationStyle,
  type CounterStyle,
  type ExportSettings,
  type MarkerStyle,
  type MosaicStyle,
  type TextStyle,
} from "@/editor/types";

/** 次回起動時に復元する、ツールごとのスタイルと書き出し設定。 */
export type EditorPreferences = {
  annotation: AnnotationStyle;
  text: TextStyle;
  counter: CounterStyle;
  mosaic: MosaicStyle;
  marker: MarkerStyle;
  export: ExportSettings;
};

/** localStorage に保存するときのキー。形式を変えたら末尾の版を上げる。 */
export const PREFERENCES_STORAGE_KEY = "pic-edit:preferences:v1";

/** 保存値がないとき・壊れているときに使う初期設定。 */
export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  annotation: { color: DEFAULT_ANNOTATION_COLOR, strokeWidth: DEFAULT_ANNOTATION_STROKE },
  text: {
    color: DEFAULT_TEXT_COLOR,
    backgroundColor: DEFAULT_TEXT_BACKGROUND,
    fontSize: DEFAULT_TEXT_SIZE,
    fontWeight: DEFAULT_TEXT_WEIGHT,
  },
  counter: { color: DEFAULT_COUNTER_COLOR, size: DEFAULT_COUNTER_SIZE },
  mosaic: { blockSize: DEFAULT_MOSAIC_BLOCK },
  marker: { color: DEFAULT_MARKER_COLOR, strokeWidth: DEFAULT_MARKER_STROKE },
  export: { backgroundColor: DEFAULT_EXPORT_BACKGROUND, padding: EXPORT_PADDING_PX },
};

/** 背景なしを表す値。 */
const TRANSPARENT = "transparent";
/** `#rgb` / `#rrggbb` 形式の色。 */
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** 保存に失敗したことを一度だけ警告するためのフラグ。 */
let hasWarnedSaveFailure = false;

/**
 * 値がプレーンなオブジェクトか判定する。
 * @param value 判定する値
 * @returns {boolean} オブジェクトなら true
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 16 進カラーならその値を、そうでなければ fallback を返す。
 * @param value 保存されていた値
 * @param fallback 不正なときの値
 * @returns {string} 色
 */
function readHexColor(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_COLOR_PATTERN.test(value) ? value : fallback;
}

/**
 * 16 進カラーか `"transparent"` ならその値を、そうでなければ fallback を返す。
 * @param value 保存されていた値
 * @param fallback 不正なときの値
 * @returns {string} 色または `"transparent"`
 */
function readBackgroundColor(value: unknown, fallback: string): string {
  return value === TRANSPARENT ? TRANSPARENT : readHexColor(value, fallback);
}

/**
 * 範囲内の整数ならその値を、そうでなければ fallback を返す。
 * @param value 保存されていた値
 * @param min 下限
 * @param max 上限
 * @param fallback 不正なときの値
 * @returns {number} 数値
 */
function readIntInRange(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

/**
 * 選択肢のいずれかならその値を、そうでなければ fallback を返す。
 * @param value 保存されていた値
 * @param options 許可する値
 * @param fallback 不正なときの値
 * @returns {number} 数値
 */
function readOption(value: unknown, options: readonly number[], fallback: number): number {
  return typeof value === "number" && options.includes(value) ? value : fallback;
}

/**
 * 保存値の 1 セクションを取り出す。オブジェクトでなければ空として扱う。
 * @param source 保存値全体
 * @param key セクション名
 * @returns {Record<string, unknown>} セクション
 */
function readSection(source: Record<string, unknown>, key: keyof EditorPreferences): Record<string, unknown> {
  const section = source[key];
  return isRecord(section) ? section : {};
}

/**
 * 保存値を検証し、不正な項目だけ初期値に置き換えた設定を作る。
 * @param raw JSON.parse した値
 * @returns {EditorPreferences} 検証済みの設定
 */
export function parseEditorPreferences(raw: unknown): EditorPreferences {
  const defaults = DEFAULT_EDITOR_PREFERENCES;
  if (!isRecord(raw)) {
    return defaults;
  }
  const annotation = readSection(raw, "annotation");
  const text = readSection(raw, "text");
  const counter = readSection(raw, "counter");
  const mosaic = readSection(raw, "mosaic");
  const marker = readSection(raw, "marker");
  const exportSettings = readSection(raw, "export");

  return {
    annotation: {
      color: readHexColor(annotation.color, defaults.annotation.color),
      strokeWidth: readIntInRange(
        annotation.strokeWidth,
        ANNOTATION_STROKE_MIN,
        ANNOTATION_STROKE_MAX,
        defaults.annotation.strokeWidth,
      ),
    },
    text: {
      color: readHexColor(text.color, defaults.text.color),
      backgroundColor: readBackgroundColor(text.backgroundColor, defaults.text.backgroundColor),
      fontSize: readOption(text.fontSize, TEXT_FONT_SIZES, defaults.text.fontSize),
      fontWeight: text.fontWeight === "normal" || text.fontWeight === "bold" ? text.fontWeight : defaults.text.fontWeight,
    },
    counter: {
      color: readHexColor(counter.color, defaults.counter.color),
      size: readOption(counter.size, COUNTER_SIZES, defaults.counter.size),
    },
    mosaic: {
      blockSize: readOption(mosaic.blockSize, MOSAIC_BLOCK_SIZES, defaults.mosaic.blockSize),
    },
    marker: {
      color: readHexColor(marker.color, defaults.marker.color),
      strokeWidth: readOption(marker.strokeWidth, MARKER_STROKE_WIDTHS, defaults.marker.strokeWidth),
    },
    export: {
      backgroundColor: readBackgroundColor(exportSettings.backgroundColor, defaults.export.backgroundColor),
      padding: readIntInRange(exportSettings.padding, EXPORT_PADDING_MIN, EXPORT_PADDING_MAX, defaults.export.padding),
    },
  };
}

/**
 * localStorage から設定を読み込む。読めない・壊れているときは初期設定を返す。
 * @returns {EditorPreferences} 復元した設定
 */
export function loadEditorPreferences(): EditorPreferences {
  try {
    const stored = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (stored === null) {
      return DEFAULT_EDITOR_PREFERENCES;
    }
    return parseEditorPreferences(JSON.parse(stored));
  } catch {
    // NOTE: プライベートモード等で localStorage が使えない、または JSON が壊れている。初期設定で起動する
    return DEFAULT_EDITOR_PREFERENCES;
  }
}

/**
 * 設定を localStorage に保存する。失敗しても編集は続けられるので、警告を一度だけ出す。
 * @param preferences 保存する設定
 * @returns {void}
 */
export function saveEditorPreferences(preferences: EditorPreferences): void {
  try {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    if (!hasWarnedSaveFailure) {
      hasWarnedSaveFailure = true;
      console.warn("Failed to save editor preferences", error);
    }
  }
}
