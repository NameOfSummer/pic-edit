import { ColorPickerButton } from "@/components/ColorPickerButton";
import { StyleFieldLabel } from "@/components/StyleFieldLabel";
import { isPresetColor } from "@/lib/color";
import {
  ANNOTATION_COLORS,
  TEXT_FONT_SIZES,
  isTransparentBackground,
  type TextStyle,
} from "@/editor/types";
import { cn } from "@/lib/utils";

/** テキストスタイルコントロールのプロパティ。 */
type Props = {
  style: TextStyle;
  onChange: (patch: Partial<TextStyle>) => void;
};

/** 背景色プリセット（色と表示名）。 */
const BACKGROUND_COLORS = [
  { color: "#FFFFFF", label: "白" },
  { color: "#9CA3AF", label: "グレー" },
  { color: "#000000", label: "黒" },
] as const;

/** 背景色プリセットの色値一覧。 */
const BACKGROUND_PRESETS = BACKGROUND_COLORS.map((item) => item.color);

/**
 * テキスト注釈の文字色・背景・サイズ・太さを選ぶツールバーコントロール。
 * @param props 現在のスタイルと変更コールバック
 * @returns {JSX.Element} スタイル操作 UI
 */
export function TextStyleControls({ style, onChange }: Props) {
  const backgroundTransparent = isTransparentBackground(style.backgroundColor);
  const customTextColor = !isPresetColor(style.color, ANNOTATION_COLORS);
  const customBackground =
    !backgroundTransparent && !isPresetColor(style.backgroundColor, BACKGROUND_PRESETS);

  return (
    <div className="flex items-center gap-3 landscape:flex-col" onPointerDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-1.5 landscape:flex-col" role="group" aria-label="文字色">
        <StyleFieldLabel>文字</StyleFieldLabel>
        {ANNOTATION_COLORS.map((color) => {
          const selected = style.color.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              title={color}
              aria-label={`文字色 ${color}`}
              aria-pressed={selected}
              className={cn(
                "neu-swatch size-[22px]",
                (color.toLowerCase() === "#ffffff" || color.toLowerCase() === "#fff100") &&
                  "outline -outline-offset-1 outline-black/15",
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange({ color })}
            />
          );
        })}
        <ColorPickerButton
          value={style.color}
          active={customTextColor}
          label="文字の自由な色"
          onChange={(color) => onChange({ color })}
        />
      </div>

      <div className="neu-divider h-6 w-px landscape:h-px landscape:w-6" />

      <div className="flex items-center gap-1.5 landscape:flex-col" role="group" aria-label="背景色">
        <StyleFieldLabel>背景</StyleFieldLabel>
        <button
          type="button"
          title="透明"
          aria-label="背景なし（透明）"
          aria-pressed={backgroundTransparent}
          className="neu-swatch relative size-[22px] overflow-hidden outline -outline-offset-1 outline-black/15"
          onClick={() => onChange({ backgroundColor: "transparent" })}
        >
          <span className="absolute inset-0 bg-white" />
          <span className="absolute inset-0 bg-[linear-gradient(to_top_right,transparent_calc(50%-1px),#e11d48_calc(50%-1px),#e11d48_calc(50%+1px),transparent_calc(50%+1px))]" />
        </button>
        {BACKGROUND_COLORS.map(({ color, label }) => {
          const selected =
            !backgroundTransparent && style.backgroundColor.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              title={label}
              aria-label={`背景色 ${label}`}
              aria-pressed={selected}
              className={cn(
                "neu-swatch size-[22px]",
                color.toLowerCase() === "#ffffff" && "outline -outline-offset-1 outline-black/15",
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange({ backgroundColor: color })}
            />
          );
        })}
        <ColorPickerButton
          value={backgroundTransparent ? "#FFFFFF" : style.backgroundColor}
          active={customBackground}
          label="背景の自由な色"
          onChange={(color) => onChange({ backgroundColor: color })}
        />
      </div>

      <div className="neu-divider h-6 w-px landscape:h-px landscape:w-6" />

      <div className="flex items-center gap-1.5 landscape:flex-col" role="group" aria-label="フォントサイズ">
        <StyleFieldLabel>サイズ</StyleFieldLabel>
        {TEXT_FONT_SIZES.map((size) => {
          const selected = style.fontSize === size;
          return (
            <button
              key={size}
              type="button"
              title={`${size}px`}
              aria-pressed={selected}
              className="neu-button h-8 min-w-9 px-2 text-xs font-medium"
              onClick={() => onChange({ fontSize: size })}
            >
              {size}
            </button>
          );
        })}
      </div>

      <div className="neu-divider h-6 w-px landscape:h-px landscape:w-6" />

      <div className="flex items-center gap-1.5 landscape:flex-col" role="group" aria-label="文字の太さ">
        <StyleFieldLabel>太さ</StyleFieldLabel>
        <button
          type="button"
          aria-pressed={style.fontWeight === "normal"}
          className="neu-button h-8 px-3 text-sm"
          onClick={() => onChange({ fontWeight: "normal" })}
        >
          標準
        </button>
        <button
          type="button"
          aria-pressed={style.fontWeight === "bold"}
          className="neu-button h-8 px-3 text-sm font-bold"
          onClick={() => onChange({ fontWeight: "bold" })}
        >
          太字
        </button>
      </div>
    </div>
  );
}
