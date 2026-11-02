import { useRef, useState } from "react";
import { Popover } from "radix-ui";
import { ColorPickerButton } from "@/components/ColorPickerButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DEFAULT_EXPORT_BACKGROUND,
  EXPORT_BACKGROUND_COLORS,
  isTransparentBackground,
} from "@/editor/types";
import { useCloseOnOutsidePointerDown } from "@/editor/useCloseOnOutsidePointerDown";
import { isPresetColor } from "@/lib/color";
import { cn } from "@/lib/utils";

/** 背景色コントロールのプロパティ。 */
type Props = {
  value: string;
  /** ツールチップとポップオーバーを開く向き */
  side: "left" | "top";
  onChange: (color: string) => void;
};

/** 背景色プリセットの色コード一覧。 */
const BACKGROUND_PRESETS = EXPORT_BACKGROUND_COLORS.map((item) => item.color);

/** 透明を表す見本（白地に赤い斜線）のクラス。 */
const transparentSwatchClass =
  "bg-white bg-[linear-gradient(to_top_right,transparent_calc(50%-1px),#e11d48_calc(50%-1px),#e11d48_calc(50%+1px),transparent_calc(50%+1px))]";

/**
 * 書き出しの背景色を選ぶツールバーボタンとポップオーバー。
 * @param props 現在の背景色と変更コールバック
 * @returns {JSX.Element} 背景色コントロール
 */
export function BackgroundColorControl({ value, side, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const transparent = isTransparentBackground(value);
  const customColor = !transparent && !isPresetColor(value, BACKGROUND_PRESETS);

  useCloseOnOutsidePointerDown(open, triggerRef, () => setOpen(false));

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover.Trigger asChild>
            <button
              ref={triggerRef}
              type="button"
              aria-label="背景色"
              className="neu-button inline-flex size-8.5 shrink-0 items-center justify-center"
            >
              <span
                aria-hidden
                className={cn(
                  "block size-[17px] rounded-full outline -outline-offset-1 outline-black/15",
                  transparent && transparentSwatchClass,
                )}
                style={transparent ? undefined : { backgroundColor: value }}
              />
            </button>
          </Popover.Trigger>
        </TooltipTrigger>
        <TooltipContent side={side}>背景色</TooltipContent>
      </Tooltip>
      <Popover.Portal>
        <Popover.Content
          side={side}
          align="center"
          sideOffset={10}
          collisionPadding={12}
          className="z-[11000] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="neu-panel flex items-center gap-2 px-3.5 py-3" role="group" aria-label="背景色">
            <button
              type="button"
              title="透明"
              aria-label="背景なし（透明）"
              aria-pressed={transparent}
              className={cn("neu-swatch size-[22px] outline -outline-offset-1 outline-black/15", transparentSwatchClass)}
              onClick={() => onChange("transparent")}
            />
            {EXPORT_BACKGROUND_COLORS.map(({ color, label }) => (
              <button
                key={color}
                type="button"
                title={label}
                aria-label={`背景色 ${label}`}
                aria-pressed={!transparent && value.toLowerCase() === color.toLowerCase()}
                className="neu-swatch size-[22px] outline -outline-offset-1 outline-black/15"
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
              />
            ))}
            <ColorPickerButton
              value={transparent ? DEFAULT_EXPORT_BACKGROUND : value}
              active={customColor}
              label="背景の自由な色"
              onChange={onChange}
              onEyedropperStart={() => setOpen(false)}
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
