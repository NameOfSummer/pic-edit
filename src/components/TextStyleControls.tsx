import { ColorPickerButton } from "@/components/ColorPickerButton";
import { StyleFieldLabel } from "@/components/StyleFieldLabel";
import { isPresetColor } from "@/lib/color";
import {
  ANNOTATION_COLORS,
  DEFAULT_TEXT_BACKGROUND,
  TEXT_FONT_SIZES,
  isTransparentBackground,
  type TextStyle,
} from "@/editor/types";
import { cn } from "@/lib/utils";

type Props = {
  style: TextStyle;
  onChange: (patch: Partial<TextStyle>) => void;
};

const BACKGROUND_COLORS = [
  { color: "#FFFFFF", label: "白" },
  { color: "#9CA3AF", label: "グレー" },
  { color: "#000000", label: "黒" },
] as const;

const BACKGROUND_PRESETS = BACKGROUND_COLORS.map((item) => item.color);

export function TextStyleControls({ style, onChange }: Props) {
  const backgroundTransparent = isTransparentBackground(style.backgroundColor);
  const customTextColor = !isPresetColor(style.color, ANNOTATION_COLORS);
  const customBackground =
    !backgroundTransparent && !isPresetColor(style.backgroundColor, BACKGROUND_PRESETS);

  return (
    <div className="flex flex-wrap items-center gap-3" onPointerDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-1.5" role="group" aria-label="文字色">
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
                "size-6 rounded-full border-2 transition-transform duration-100 enabled:active:scale-90",
                selected ? "border-black scale-110" : "border-[var(--border)] hover:border-black",
                (color.toLowerCase() === "#ffffff" || color.toLowerCase() === "#fff100") &&
                  "shadow-[inset_0_0_0_1px_var(--border)]",
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

      <div className="h-6 w-px shrink-0 bg-[var(--border)]" />

      <div className="flex items-center gap-1.5" role="group" aria-label="背景色">
        <StyleFieldLabel>背景</StyleFieldLabel>
        <button
          type="button"
          title="透明"
          aria-label="背景なし（透明）"
          aria-pressed={backgroundTransparent}
          className={cn(
            "relative size-6 overflow-hidden rounded-full border-2 transition-transform duration-100 enabled:active:scale-90",
            backgroundTransparent ? "border-black scale-110" : "border-[var(--border)] hover:border-black",
          )}
          onClick={() => onChange({ backgroundColor: DEFAULT_TEXT_BACKGROUND })}
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
                "size-6 rounded-full border-2 transition-transform duration-100 enabled:active:scale-90",
                selected ? "border-black scale-110" : "border-[var(--border)] hover:border-black",
                color.toLowerCase() === "#ffffff" && "shadow-[inset_0_0_0_1px_var(--border)]",
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

      <div className="h-6 w-px shrink-0 bg-[var(--border)]" />

      <div className="flex items-center gap-1.5" role="group" aria-label="フォントサイズ">
        <StyleFieldLabel>サイズ</StyleFieldLabel>
        {TEXT_FONT_SIZES.map((size) => {
          const selected = style.fontSize === size;
          return (
            <button
              key={size}
              type="button"
              title={`${size}px`}
              aria-pressed={selected}
              className={cn(
                "h-8 min-w-9 rounded-md border-2 px-2 text-xs font-medium transition-[background-color,border-color,transform] duration-100 enabled:active:scale-95",
                selected
                  ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
                  : "border-[var(--border)] bg-white text-black hover:border-[var(--brand)]",
              )}
              onClick={() => onChange({ fontSize: size })}
            >
              {size}
            </button>
          );
        })}
      </div>

      <div className="h-6 w-px shrink-0 bg-[var(--border)]" />

      <div className="flex items-center gap-1.5" role="group" aria-label="文字の太さ">
        <StyleFieldLabel>太さ</StyleFieldLabel>
        <button
          type="button"
          aria-pressed={style.fontWeight === "normal"}
          className={cn(
            "h-8 rounded-md border-2 px-3 text-sm transition-[background-color,border-color,transform] duration-100 enabled:active:scale-95",
            style.fontWeight === "normal"
              ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
              : "border-[var(--border)] bg-white text-black hover:border-[var(--brand)]",
          )}
          onClick={() => onChange({ fontWeight: "normal" })}
        >
          標準
        </button>
        <button
          type="button"
          aria-pressed={style.fontWeight === "bold"}
          className={cn(
            "h-8 rounded-md border-2 px-3 text-sm font-bold transition-[background-color,border-color,transform] duration-100 enabled:active:scale-95",
            style.fontWeight === "bold"
              ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
              : "border-[var(--border)] bg-white text-black hover:border-[var(--brand)]",
          )}
          onClick={() => onChange({ fontWeight: "bold" })}
        >
          太字
        </button>
      </div>
    </div>
  );
}
