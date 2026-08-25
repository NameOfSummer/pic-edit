/** `#rgb` / `#rrggbb` を 6 桁へ揃える */
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

export function isPresetColor(color: string, presets: readonly string[]): boolean {
  const hex = toHexColor(color, color);
  return presets.some((preset) => toHexColor(preset) === hex);
}

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

export function hexToRgb(hex: string): Rgb {
  const normalized = toHexColor(hex, "#000000").slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
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

export function hslToRgb({ h, s, l }: Hsl): Rgb {
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

export function hslToHex(hsl: Hsl): string {
  return rgbToHex(hslToRgb(hsl));
}

export function hexToHsl(hex: string): Hsl {
  return rgbToHsl(hexToRgb(hex));
}

/** macOS 風グリッド: グレースケール1行 + 色相列×明度行 */
export const COLOR_GRID_COLS = 8;
export const COLOR_GRID_ROWS = 6;

export function buildGrayscaleRow(): string[] {
  return Array.from({ length: COLOR_GRID_COLS }, (_, i) => {
    const l = 100 - (i / (COLOR_GRID_COLS - 1)) * 100;
    return hslToHex({ h: 0, s: 0, l });
  });
}

/**
 * 左からシアン寄り→紫→赤→黄→緑（スクリーンショットに近い並び）。
 * 上段ほど濃く、下段ほどパステル。
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
