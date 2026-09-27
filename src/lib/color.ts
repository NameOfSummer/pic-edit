/**
 * `#rgb` / `#rrggbb` を 6 桁へ揃える。解釈できないときは fallback を返す。
 * @param color 入力色
 * @param fallback 解釈できないときの色
 * @returns {string} 6 桁の `#rrggbb`
 */
export function toHexColor(color: string, fallback = "#32CD32"): string {
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback.toLowerCase();
}

/**
 * 色がプリセットのいずれかと一致するか判定する。
 * @param color 比較する色
 * @param presets プリセットの色一覧
 * @returns {boolean} 一致すれば true
 */
export function isPresetColor(color: string, presets: readonly string[]): boolean {
  const hex = toHexColor(color, color);
  return presets.some((preset) => toHexColor(preset) === hex);
}

/** 0〜255 の RGB。 */
export type Rgb = { r: number; g: number; b: number };
/** 色相・彩度・明度。h は度、s と l は 0〜100。 */
export type Hsl = { h: number; s: number; l: number };

/**
 * 16 進カラーを RGB に変換する。
 * @param hex `#rgb` または `#rrggbb`
 * @returns {Rgb} 0〜255 の各成分
 */
export function hexToRgb(hex: string): Rgb {
  const normalized = toHexColor(hex, "#000000").slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

/**
 * RGB を 16 進カラーに変換する。
 * @param rgb 赤・緑・青
 * @returns {string} `#rrggbb`
 */
export function rgbToHex(rgb: Rgb): string {
  const { r, g, b } = rgb;
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * RGB を HSL に変換する。
 * @param rgb 赤・緑・青
 * @returns {Hsl} 色相・彩度・明度
 */
export function rgbToHsl(rgb: Rgb): Hsl {
  const { r, g, b } = rgb;
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * HSL を RGB に変換する。
 * @param hsl 色相・彩度・明度
 * @returns {Rgb} 0〜255 の各成分
 */
export function hslToRgb(hsl: Hsl): Rgb {
  const { h, s, l } = hsl;
  const hn = ((h % 360) + 360) % 360 / 360;
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

/**
 * HSL を 16 進カラーに変換する。
 * @param hsl 色相・彩度・明度
 * @returns {string} `#rrggbb`
 */
export function hslToHex(hsl: Hsl): string {
  return rgbToHex(hslToRgb(hsl));
}

/**
 * 16 進カラーを HSL に変換する。
 * @param hex `#rgb` または `#rrggbb`
 * @returns {Hsl} 色相・彩度・明度
 */
export function hexToHsl(hex: string): Hsl {
  return rgbToHsl(hexToRgb(hex));
}

/** カラーピッカーのグレースケール列数。 */
export const COLOR_GRID_COLS = 8;
/** カラーピッカーの有彩色の行数。 */
export const COLOR_GRID_ROWS = 6;

/**
 * 白から黒までの 1 行を作る。
 * @returns {string[]} 左が白、右が黒の `#rrggbb`
 */
export function buildGrayscaleRow(): string[] {
  return Array.from({ length: COLOR_GRID_COLS }, (_, i) => {
    const l = 100 - (i / (COLOR_GRID_COLS - 1)) * 100;
    return hslToHex({ h: 0, s: 0, l });
  });
}

/**
 * 左からシアン寄り→紫→赤→黄→緑の並びで、上段ほど濃い格子を作る。
 * @returns {string[][]} 行ごとの `#rrggbb`
 */
export function buildChromaticGrid(): string[][] {
  return Array.from({ length: COLOR_GRID_ROWS }, (_, row) =>
    Array.from({ length: COLOR_GRID_COLS }, (_, col) => {
      const h = (195 + (col / COLOR_GRID_COLS) * 360) % 360;
      const t = row / (COLOR_GRID_ROWS - 1);
      const s = 92 - t * 48;
      const l = 28 + t * 58;
      return hslToHex({ h, s, l });
    }),
  );
}
