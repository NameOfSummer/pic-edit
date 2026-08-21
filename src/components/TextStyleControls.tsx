import { ANNOTATION_COLORS, TEXT_FONT_SIZES, type TextStyle } from "@/editor/types";
import { cn } from "@/lib/utils";

type Props = {
  style: TextStyle;
  onChange: (patch: Partial<TextStyle>) => void;
};

export function TextStyleControls({ style, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3" onPointerDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-1.5" role="group" aria-label="テキストの色">
        {ANNOTATION_COLORS.map((color) => {
          const selected = style.color.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              title={color}
              aria-label={`色 ${color}`}
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
      </div>

      <div className="h-6 w-px shrink-0 bg-[var(--border)]" />

      <div className="flex items-center gap-1" role="group" aria-label="フォントサイズ">
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

      <div className="flex items-center gap-1" role="group" aria-label="文字の太さ">
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
