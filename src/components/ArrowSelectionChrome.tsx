import { useRef, type PointerEvent } from "react";
import { SELECTION_CHROME_Z } from "@/components/BoxSelectionChrome";
import type { ArrowAnnotation, ArrowPatch } from "@/editor/types";

type Props = {
  arrow: ArrowAnnotation;
  onChange: (patch: ArrowPatch) => void;
};

type DragState = { kind: "start" | "end"; pointerId: number };

/** 矢印の端点ハンドル。注釈本体より前面に重ねる。 */
export function ArrowSelectionChrome({ arrow, onChange }: Props) {
  const dragRef = useRef<DragState | null>(null);

  const onHandlePointerDown = (kind: "start" | "end") => (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    dragRef.current = { kind, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    if (drag.kind === "start") {
      onChange({ x1: Math.round(event.clientX), y1: Math.round(event.clientY) });
      return;
    }
    onChange({ x2: Math.round(event.clientX), y2: Math.round(event.clientY) });
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const handleClass =
    "pointer-events-auto absolute size-3.5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-[var(--brand)] bg-white shadow-md active:cursor-grabbing";

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: SELECTION_CHROME_Z }}>
      <button
        type="button"
        aria-label="始点"
        title="ドラッグで始点を移動"
        className={handleClass}
        style={{ left: arrow.x1, top: arrow.y1 }}
        onPointerDown={onHandlePointerDown("start")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <button
        type="button"
        aria-label="終点"
        title="ドラッグで終点を移動"
        className={handleClass}
        style={{ left: arrow.x2, top: arrow.y2 }}
        onPointerDown={onHandlePointerDown("end")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
