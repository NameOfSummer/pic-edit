import { useState } from "react";
import { Popover } from "radix-ui";
import { ColorPickerPanel } from "@/components/ColorPickerPanel";
import { useEyedropper } from "@/editor/EyedropperContext";
import { toHexColor } from "@/lib/color";
import { cn } from "@/lib/utils";

/** カラーピッカーボタンのプロパティ。 */
type Props = {
  value: string;
  onChange: (color: string) => void;
  /** プリセット以外の色が選ばれているとき true */
  active?: boolean;
  label?: string;
};

/**
 * プリセットにない色を選ぶためのカラーピッカー（macOS 風パネル）。
 * @param props 現在色と変更コールバック
 * @returns {JSX.Element} ピッカー起動ボタン
 */
export function ColorPickerButton({
  value,
  onChange,
  active = false,
  label = "自由な色を選ぶ",
}: Props) {
  const hex = toHexColor(value);
  const eyedropper = useEyedropper();
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          title={label}
          aria-label={label}
          className={cn(
            "relative size-6 shrink-0 overflow-hidden rounded-full border-2 transition-transform duration-100 enabled:active:scale-90",
            active ? "scale-110 border-black" : "border-[var(--border)] hover:border-black",
          )}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `
                conic-gradient(
                  from 0deg,
                  #e60012,
                  #f39800,
                  #fff100,
                  #32cd32,
                  #1e90ff,
                  #0000cd,
                  #800073,
                  #e60012
                )
              `,
            }}
          />
          <span
            aria-hidden
            className="absolute inset-[5px] rounded-full border border-white/80 shadow-sm"
            style={{ backgroundColor: hex }}
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={10}
          collisionPadding={12}
          className="z-[11000] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <ColorPickerPanel
            value={hex}
            onChange={onChange}
            onEyedropper={
              eyedropper
                ? () => {
                    setOpen(false);
                    eyedropper.startEyedropper(onChange);
                  }
                : undefined
            }
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
