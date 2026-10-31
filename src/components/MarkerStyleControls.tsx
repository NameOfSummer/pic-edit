import { ColorPickerButton } from "@/components/ColorPickerButton";
import { StyleFieldLabel } from "@/components/StyleFieldLabel";
import { isPresetColor } from "@/lib/color";
import { MARKER_COLORS, MARKER_STROKE_WIDTHS, type MarkerStyle } from "@/editor/types";

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
    <div className="flex items-center gap-3 landscape:flex-col" onPointerDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-1.5 landscape:flex-col" role="group" aria-label="マーカーの色">
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
              className="neu-swatch size-[22px]"
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

      <div className="neu-divider h-6 w-px landscape:h-px landscape:w-6" />

      <div className="flex items-center gap-1.5 landscape:flex-col" role="group" aria-label="マーカーの太さ">
        <StyleFieldLabel>太さ</StyleFieldLabel>
        {MARKER_STROKE_WIDTHS.map((width) => {
          const selected = style.strokeWidth === width;
          return (
            <button
              key={width}
              type="button"
              title={`${width}px`}
              aria-pressed={selected}
              className="neu-button flex h-8 w-9 items-center justify-center"
              onClick={() => onChange({ strokeWidth: width })}
            >
              <span
                className="block w-5 rounded-full"
                style={{
                  height: Math.max(4, width * 0.28),
                  backgroundColor: style.color,
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
