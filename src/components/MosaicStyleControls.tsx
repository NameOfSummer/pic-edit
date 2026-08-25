import { StyleFieldLabel } from "@/components/StyleFieldLabel";
import { MOSAIC_BLOCK_SIZES, type MosaicStyle } from "@/editor/types";
import { cn } from "@/lib/utils";

type Props = {
  style: MosaicStyle;
  onChange: (patch: Partial<MosaicStyle>) => void;
};

export function MosaicStyleControls({ style, onChange }: Props) {
  return (
    <div
      className="flex items-center gap-1.5"
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
            className={cn(
              "flex h-8 w-9 items-center justify-center rounded-md border-2 transition-[background-color,border-color,transform] duration-100 enabled:active:scale-95",
              selected
                ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
                : "border-[var(--border)] bg-white text-black hover:border-[var(--brand)]",
            )}
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
                  style={{ backgroundColor: selected ? "#ffffff" : "var(--brand)", opacity: 0.35 + index * 0.15 }}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
