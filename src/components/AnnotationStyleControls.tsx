import { ANNOTATION_COLORS, ANNOTATION_STROKE_WIDTHS, type AnnotationStyle } from "@/editor/types";
import { cn } from "@/lib/utils";

type Props = {
  style: AnnotationStyle;
  onChange: (patch: Partial<AnnotationStyle>) => void;
  label?: string;
};

export function AnnotationStyleControls({ style, onChange, label = "注釈" }: Props) {
  return (
    <div className="flex items-center gap-3" onPointerDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-1.5" role="group" aria-label={`${label}の色`}>
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

      <div className="flex items-center gap-1" role="group" aria-label={`${label}の太さ`}>
        {ANNOTATION_STROKE_WIDTHS.map((width) => {
          const selected = style.strokeWidth === width;
          return (
            <button
              key={width}
              type="button"
              title={`${width}px`}
              aria-label={`太さ ${width}px`}
              aria-pressed={selected}
              className={cn(
                "flex h-8 w-9 items-center justify-center rounded-md border-2 transition-[background-color,border-color,transform] duration-100 enabled:active:scale-95",
                selected
                  ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
                  : "border-[var(--border)] bg-white text-black hover:border-[var(--brand)]",
              )}
              onClick={() => onChange({ strokeWidth: width })}
            >
              <span
                className="block w-5 rounded-full"
                style={{
                  height: Math.max(2, width),
                  backgroundColor: selected ? "#ffffff" : style.color,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
