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
    <div className="flex items-center gap-3 landscape:flex-col" onPointerDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-1.5 landscape:flex-col" role="group" aria-label="カウンターの色">
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
          active={customColor}
          label="番号の自由な色"
          onChange={(color) => onChange({ color })}
        />
      </div>

      <div className="neu-divider h-6 w-px landscape:h-px landscape:w-6" />

      <div className="flex items-center gap-1.5 landscape:flex-col" role="group" aria-label="カウンターのサイズ">
        <StyleFieldLabel>サイズ</StyleFieldLabel>
        {COUNTER_SIZES.map((size) => {
          const selected = style.size === size;
          return (
            <button
              key={size}
              type="button"
              title={`${size}px`}
              aria-pressed={selected}
              className="neu-button flex h-8 w-9 items-center justify-center"
              onClick={() => onChange({ size })}
            >
              <span
                className="rounded-full"
                style={{
                  width: size * 0.45,
                  height: size * 0.45,
                  backgroundColor: style.color,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
