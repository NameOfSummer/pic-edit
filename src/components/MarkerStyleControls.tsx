import { ColorPickerButton } from "@/components/ColorPickerButton";
import { StyleFieldLabel } from "@/components/StyleFieldLabel";
import { isPresetColor } from "@/lib/color";
import { MARKER_COLORS, MARKER_STROKE_WIDTHS, type MarkerStyle } from "@/editor/types";
import { cn } from "@/lib/utils";

/** マーカーの色・線幅コントロールのプロパティ。 */
type Props = {
  style: MarkerStyle;
  onChange: (patch: Partial<MarkerStyle>) => void;
};

/**
 * マーカー注釈の色と太さを選ぶツールバーコントロール。
 * @param props 現在のスタイルと変更コールバック
 * @returns {JSX.Element} スタイル操作 UI
 */
export function MarkerStyleControls({ style, onChange }: Props) {
  const customColor = !isPresetColor(style.color, MARKER_COLORS);

  return (
    <div className="flex flex-wrap items-center gap-3" onPointerDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-1.5" role="group" aria-label="マーカーの色">
        <StyleFieldLabel>色</StyleFieldLabel>
        {MARKER_COLORS.map((color) => {
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
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange({ color })}
            />
          );
        })}
        <ColorPickerButton
          value={style.color}
          active={customColor}
          label="マーカーの自由な色"
          onChange={(color) => onChange({ color })}
        />
      </div>

      <div className="h-6 w-px shrink-0 bg-[var(--border)]" />

      <div className="flex items-center gap-1.5" role="group" aria-label="マーカーの太さ">
        <StyleFieldLabel>太さ</StyleFieldLabel>
        {MARKER_STROKE_WIDTHS.map((width) => {
          const selected = style.strokeWidth === width;
          return (
            <button
              key={width}
              type="button"
              title={`${width}px`}
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
                  height: Math.max(4, width * 0.28),
                  backgroundColor: selected ? "#111111" : style.color,
                  opacity: selected ? 1 : 0.7,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
