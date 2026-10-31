import { ColorPickerButton } from "@/components/ColorPickerButton";
import { StyleFieldLabel } from "@/components/StyleFieldLabel";
import { isPresetColor } from "@/lib/color";
import { ANNOTATION_COLORS, ANNOTATION_STROKE_WIDTHS, type AnnotationStyle } from "@/editor/types";
import { cn } from "@/lib/utils";

/** 注釈の色・線幅コントロールのプロパティ。 */
type Props = {
  style: AnnotationStyle;
  onChange: (patch: Partial<AnnotationStyle>) => void;
  label?: string;
};

/**
 * 矢印・矩形など共通注釈の色と線幅を選ぶツールバーコントロール。
 * @param props 現在のスタイルと変更コールバック
 * @returns {JSX.Element} スタイル操作 UI
 */
export function AnnotationStyleControls({ style, onChange, label = "注釈" }: Props) {
  const customColor = !isPresetColor(style.color, ANNOTATION_COLORS);

  return (
    <div className="flex items-center gap-3 landscape:flex-col" onPointerDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-1.5 landscape:flex-col" role="group" aria-label={`${label}の色`}>
        <StyleFieldLabel>{label}</StyleFieldLabel>
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
          label={`${label}の自由な色`}
          onChange={(color) => onChange({ color })}
        />
      </div>

      <div className="neu-divider h-6 w-px landscape:h-px landscape:w-6" />

      <div className="flex items-center gap-1.5 landscape:flex-col" role="group" aria-label={`${label}の太さ`}>
        <StyleFieldLabel>太さ</StyleFieldLabel>
        {ANNOTATION_STROKE_WIDTHS.map((width) => {
          const selected = style.strokeWidth === width;
          return (
            <button
              key={width}
              type="button"
              title={`${width}px`}
              aria-label={`太さ ${width}px`}
              aria-pressed={selected}
              className="neu-button flex h-8 w-9 items-center justify-center"
              onClick={() => onChange({ strokeWidth: width })}
            >
              <span
                className="block w-5 rounded-full"
                style={{
                  height: Math.max(2, width),
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
