import { StyleFieldLabel } from "@/components/StyleFieldLabel";
import { MOSAIC_BLOCK_SIZES, type MosaicStyle } from "@/editor/types";

/** モザイク粗さコントロールのプロパティ。 */
type Props = {
  style: MosaicStyle;
  onChange: (patch: Partial<MosaicStyle>) => void;
};

/**
 * モザイク注釈のブロックサイズ（粗さ）を選ぶツールバーコントロール。
 * @param props 現在のスタイルと変更コールバック
 * @returns {JSX.Element} スタイル操作 UI
 */
export function MosaicStyleControls({ style, onChange }: Props) {
  return (
    <div
      className="flex items-center gap-1.5 landscape:flex-col"
      onPointerDown={(event) => event.stopPropagation()}
      role="group"
      aria-label="モザイクの粗さ"
    >
      <StyleFieldLabel>粗さ</StyleFieldLabel>
      {MOSAIC_BLOCK_SIZES.map((size) => {
        const selected = style.blockSize === size;
        return (
          <button
            key={size}
            type="button"
            title={`${size}px`}
            aria-pressed={selected}
            className="neu-button flex h-8 w-9 items-center justify-center"
            onClick={() => onChange({ blockSize: size })}
          >
            <span
              className="grid grid-cols-2 gap-px"
              style={{ width: Math.min(16, size), height: Math.min(16, size) }}
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={index}
                  className="block size-full rounded-[1px]"
                  style={{ backgroundColor: "currentColor", opacity: 0.35 + index * 0.15 }}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
