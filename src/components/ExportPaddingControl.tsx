import { useRef, useState } from "react";
import { Minus, Plus, SquareDashed } from "lucide-react";
import { Popover } from "radix-ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  EXPORT_PADDING_MAX,
  EXPORT_PADDING_MIN,
  EXPORT_PADDING_PRESETS,
  EXPORT_PADDING_STEP,
} from "@/editor/types";
import { useCloseOnOutsidePointerDown } from "@/editor/useCloseOnOutsidePointerDown";

/** 余白コントロールのプロパティ。 */
type Props = {
  value: number;
  /** ツールチップとポップオーバーを開く向き */
  side: "left" | "top";
  onChange: (padding: number) => void;
};

/**
 * 書き出しの余白を指定するツールバーボタンとポップオーバー。
 * @param props 現在の余白と変更コールバック
 * @returns {JSX.Element} 余白コントロール
 */
export function ExportPaddingControl({ value, side, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const label = `余白 ${value}px`;

  useCloseOnOutsidePointerDown(open, triggerRef, () => setOpen(false));

  /**
   * 余白を一定幅だけ増減する（下限・上限で止める）。
   * @param direction 増やすなら 1、減らすなら -1
   * @returns {void}
   */
  function stepPadding(direction: 1 | -1): void {
    const next = value + direction * EXPORT_PADDING_STEP;
    onChange(Math.min(EXPORT_PADDING_MAX, Math.max(EXPORT_PADDING_MIN, next)));
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover.Trigger asChild>
            <button
              ref={triggerRef}
              type="button"
              aria-label={label}
              className="neu-button inline-flex size-8.5 shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:size-[17px] [&_svg]:shrink-0"
            >
              <SquareDashed />
            </button>
          </Popover.Trigger>
        </TooltipTrigger>
        <TooltipContent side={side}>{label}</TooltipContent>
      </Tooltip>
      <Popover.Portal>
        <Popover.Content
          side={side}
          align="center"
          sideOffset={10}
          collisionPadding={12}
          className="z-[11000] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="neu-panel flex items-center gap-1.5 px-3.5 py-3" role="group" aria-label="余白">
            {EXPORT_PADDING_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                title={`${preset}px`}
                aria-label={`余白 ${preset}px`}
                aria-pressed={value === preset}
                className="neu-button flex h-8 w-9 items-center justify-center font-heading text-xs font-medium tabular-nums"
                onClick={() => onChange(preset)}
              >
                {preset}
              </button>
            ))}
            <div className="ml-1 flex items-center gap-1">
              <button
                type="button"
                title="余白を減らす"
                aria-label="余白を減らす"
                disabled={value <= EXPORT_PADDING_MIN}
                className="neu-button flex size-7 items-center justify-center [&_svg]:size-3.5"
                onClick={() => stepPadding(-1)}
              >
                <Minus />
              </button>
              <span
                className="w-7 text-center font-heading text-xs font-medium tabular-nums"
                aria-live="polite"
                aria-label={label}
              >
                {value}
              </span>
              <button
                type="button"
                title="余白を増やす"
                aria-label="余白を増やす"
                disabled={value >= EXPORT_PADDING_MAX}
                className="neu-button flex size-7 items-center justify-center [&_svg]:size-3.5"
                onClick={() => stepPadding(1)}
              >
                <Plus />
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
