import { useEffect, useRef, type PointerEvent } from "react";
import { SELECTION_CHROME_Z } from "@/components/BoxSelectionChrome";
import { counterLabelColor } from "@/editor/counterGeometry";
import { TEXT_FONT_FAMILY, type CounterAnnotation, type CounterPatch } from "@/editor/types";
import { cn } from "@/lib/utils";

/** カウンター表示コンポーネントのプロパティ。 */
type Props = {
  counter: CounterAnnotation;
  selected: boolean;
  interactive: boolean;
  onSelect: () => void;
  onChange: (patch: CounterPatch) => void;
};

/** カウンター移動のドラッグ状態。 */
type DragState = {
  kind: "move";
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

/**
 * キャンバス上に番号カウンター注釈を描画し、選択・移動を扱う。
 * @param props カウンターデータと操作コールバック
 * @returns {JSX.Element} カウンター表示
 */
export function CounterView({ counter, selected, interactive, onSelect, onChange }: Props) {
  const dragRef = useRef<DragState | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      onChangeRef.current({
        x: Math.round(drag.originX + (event.clientX - drag.startX)),
        y: Math.round(drag.originY + (event.clientY - drag.startY)),
      });
    };

    const onPointerUp = (event: globalThis.PointerEvent) => {
      if (dragRef.current?.pointerId === event.pointerId) {
        dragRef.current = null;
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  const onMovePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!interactive) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    onSelect();
    dragRef.current = {
      kind: "move",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: counter.x,
      originY: counter.y,
    };
  };

  const radius = counter.size / 2;
  const labelColor = counterLabelColor(counter.color);

  return (
    <div
      data-counter-id={counter.id}
      className={cn(
        "absolute flex touch-none items-center justify-center rounded-full shadow-md",
        interactive ? "pointer-events-auto cursor-move" : "pointer-events-none",
        selected && interactive && "outline outline-2 outline-[var(--brand)] outline-offset-2",
      )}
      style={{
        left: counter.x - radius,
        top: counter.y - radius,
        width: counter.size,
        height: counter.size,
        zIndex: selected && interactive ? SELECTION_CHROME_Z - 1 : 3980,
        backgroundColor: counter.color,
        color: labelColor,
        fontFamily: TEXT_FONT_FAMILY,
        fontSize: Math.max(11, counter.size * 0.48),
        fontWeight: 700,
        lineHeight: 1,
      }}
      onPointerDown={onMovePointerDown}
    >
      {counter.value}
    </div>
  );
}
