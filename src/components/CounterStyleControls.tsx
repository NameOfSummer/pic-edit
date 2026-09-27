import { ColorPickerButton } from "@/components/ColorPickerButton";
import { StyleFieldLabel } from "@/components/StyleFieldLabel";
import { isPresetColor } from "@/lib/color";
import { ANNOTATION_COLORS, COUNTER_SIZES, type CounterStyle } from "@/editor/types";
import { cn } from "@/lib/utils";

/** カウンターの色・サイズコントロールのプロパティ。 */
type Props = {
  style: CounterStyle;
  onChange: (patch: Partial<CounterStyle>) => void;
};

/**
 * 番号カウンター注釈の色とサイズを選ぶツールバーコントロール。
 * @param props 現在のスタイルと変更コールバック
 * @returns {JSX.Element} スタイル操作 UI
 */
export function CounterStyleControls({ style, onChange }: Props) {
  const customColor = !isPresetColor(style.color, ANNOTATION_COLORS);

  return (
    <div className="flex flex-wrap items-center gap-3" onPointerDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-1.5" role="group" aria-label="カウンターの色">
        <StyleFieldLabel>色</StyleFieldLabel>
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
        <ColorPickerButton
          value={style.color}
          active={customColor}
          label="番号の自由な色"
          onChange={(color) => onChange({ color })}
        />
      </div>

      <div className="h-6 w-px shrink-0 bg-[var(--border)]" />

      <div className="flex items-center gap-1.5" role="group" aria-label="カウンターのサイズ">
        <StyleFieldLabel>サイズ</StyleFieldLabel>
        {COUNTER_SIZES.map((size) => {
          const selected = style.size === size;
          return (
            <button
              key={size}
              type="button"
              title={`${size}px`}
              aria-pressed={selected}
              className={cn(
                "flex h-8 w-9 items-center justify-center rounded-md border-2 transition-[background-color,border-color,transform] duration-100 enabled:active:scale-95",
                selected
                  ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
                  : "border-[var(--border)] bg-white text-black hover:border-[var(--brand)]",
              )}
              onClick={() => onChange({ size })}
            >
              <span
                className="rounded-full"
                style={{
                  width: size * 0.45,
                  height: size * 0.45,
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
