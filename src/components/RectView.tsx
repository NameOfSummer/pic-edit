import { useEffect, useRef, type PointerEvent } from "react";
import { SELECTION_CHROME_Z } from "@/components/BoxSelectionChrome";
import type { RectAnnotation, RectPatch } from "@/editor/types";
import { cn } from "@/lib/utils";

type Props = {
  rect: RectAnnotation;
  selected?: boolean;
  interactive: boolean;
  onSelect: () => void;
  onChange: (patch: RectPatch) => void;
};

type DragState = {
  kind: "move";
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export function RectView({ rect, selected = false, interactive, onSelect, onChange }: Props) {
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
      originX: rect.x,
      originY: rect.y,
    };
  };

  return (
    <div
      data-rect-id={rect.id}
      className={cn(
        "absolute touch-none",
        interactive ? "pointer-events-auto cursor-move" : "pointer-events-none",
      )}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: selected ? SELECTION_CHROME_Z - 1 : 3900,
        transform: `rotate(${rect.rotation}deg)`,
        transformOrigin: "center center",
      }}
      onPointerDown={onMovePointerDown}
    >
      <div
        className="pointer-events-none absolute inset-0 box-border"
        style={{
          borderStyle: "solid",
          borderColor: rect.color,
          borderWidth: rect.strokeWidth,
        }}
      />
    </div>
  );
}
