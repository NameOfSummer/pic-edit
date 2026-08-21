import { useEffect, useRef, type PointerEvent } from "react";
import { RotateCw } from "lucide-react";
import { rotateMarkerEndpoints } from "@/editor/markerGeometry";
import { MARKER_OPACITY, type MarkerAnnotation, type MarkerPatch } from "@/editor/types";
import { cn } from "@/lib/utils";

type Props = {
  marker: MarkerAnnotation;
  selected: boolean;
  interactive: boolean;
  onSelect: () => void;
  onChange: (patch: MarkerPatch) => void;
};

type DragState =
  | { kind: "move"; pointerId: number; startX: number; startY: number; origin: MarkerAnnotation }
  | {
      kind: "rotate";
      pointerId: number;
      centerX: number;
      centerY: number;
      startAngle: number;
      origin: MarkerAnnotation;
    };

function normalizeDegrees(value: number): number {
  const wrapped = value % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function snapRotation(degrees: number, shiftKey: boolean): number {
  if (!shiftKey) {
    return degrees;
  }
  return Math.round(degrees / 15) * 15;
}

export function MarkerView({ marker, selected, interactive, onSelect, onChange }: Props) {
  const dragRef = useRef<DragState | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pad = marker.strokeWidth / 2 + 8;
  const minX = Math.min(marker.x1, marker.x2) - pad;
  const minY = Math.min(marker.y1, marker.y2) - pad;
  const width = Math.max(marker.strokeWidth + 16, Math.abs(marker.x2 - marker.x1) + pad * 2);
  const height = Math.max(marker.strokeWidth + 16, Math.abs(marker.y2 - marker.y1) + pad * 2);
  const cx = (marker.x1 + marker.x2) / 2;
  const cy = (marker.y1 + marker.y2) / 2;

  useEffect(() => {
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      if (drag.kind === "move") {
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        onChangeRef.current({
          x1: Math.round(drag.origin.x1 + dx),
          y1: Math.round(drag.origin.y1 + dy),
          x2: Math.round(drag.origin.x2 + dx),
          y2: Math.round(drag.origin.y2 + dy),
        });
        return;
      }

      const pointerAngle = (Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180) / Math.PI;
      const delta = snapRotation(pointerAngle - drag.startAngle, event.shiftKey);
      onChangeRef.current(rotateMarkerEndpoints(drag.origin, normalizeDegrees(delta)));
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

  const onMovePointerDown = (event: PointerEvent<SVGElement>) => {
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
      origin: { ...marker },
    };
  };

  const onRotatePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!interactive) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    onSelect();
    const pointerAngle = (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI;
    dragRef.current = {
      kind: "rotate",
      pointerId: event.pointerId,
      centerX: cx,
      centerY: cy,
      startAngle: pointerAngle,
      origin: { ...marker },
    };
  };

  return (
    <div
      data-marker-id={marker.id}
      className={cn("absolute", interactive ? "pointer-events-auto" : "pointer-events-none")}
      style={{ left: minX, top: minY, width, height, zIndex: 3870 }}
    >
      <svg width={width} height={height} className="overflow-visible">
        <line
          x1={marker.x1 - minX}
          y1={marker.y1 - minY}
          x2={marker.x2 - minX}
          y2={marker.y2 - minY}
          stroke={marker.color}
          strokeWidth={marker.strokeWidth}
          strokeLinecap="round"
          opacity={MARKER_OPACITY}
          style={{ mixBlendMode: "multiply" }}
          className={interactive ? "cursor-move" : undefined}
          onPointerDown={onMovePointerDown}
        />
        {/* ヒット領域を太くする透明線 */}
        <line
          x1={marker.x1 - minX}
          y1={marker.y1 - minY}
          x2={marker.x2 - minX}
          y2={marker.y2 - minY}
          stroke="transparent"
          strokeWidth={Math.max(24, marker.strokeWidth)}
          strokeLinecap="round"
          className={interactive ? "cursor-move" : undefined}
          onPointerDown={onMovePointerDown}
        />
      </svg>

      {selected && interactive && (
        <>
          <div
            className="pointer-events-none absolute outline outline-2 outline-[var(--brand)] outline-offset-2"
            style={{
              left: Math.min(marker.x1, marker.x2) - minX - 4,
              top: Math.min(marker.y1, marker.y2) - minY - 4,
              width: Math.abs(marker.x2 - marker.x1) + 8,
              height: Math.abs(marker.y2 - marker.y1) + 8,
            }}
          />
          <button
            type="button"
            aria-label="回転"
            title="ドラッグで回転（Shift で 15° 刻み）"
            className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-[var(--brand)] text-[var(--brand-foreground)] shadow-md active:cursor-grabbing"
            style={{
              left: cx - minX,
              top: cy - minY - Math.max(28, marker.strokeWidth / 2 + 20),
            }}
            onPointerDown={onRotatePointerDown}
          >
            <RotateCw className="size-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
