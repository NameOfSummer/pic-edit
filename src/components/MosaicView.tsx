import { useEffect, useRef, type PointerEvent } from "react";
import { RotateCw } from "lucide-react";
import { renderMosaicPreview } from "@/editor/mosaicGeometry";
import type { ImageLayer, MosaicAnnotation, MosaicPatch } from "@/editor/types";
import { cn } from "@/lib/utils";

type Props = {
  mosaic: MosaicAnnotation;
  layers: ImageLayer[];
  selected: boolean;
  interactive: boolean;
  onSelect: () => void;
  onChange: (patch: MosaicPatch) => void;
};

type DragState =
  | { kind: "move"; pointerId: number; startX: number; startY: number; originX: number; originY: number }
  | {
      kind: "resize";
      pointerId: number;
      centerX: number;
      centerY: number;
      startDistance: number;
      startWidth: number;
      startHeight: number;
    }
  | {
      kind: "rotate";
      pointerId: number;
      centerX: number;
      centerY: number;
      startAngle: number;
      originRotation: number;
    };

function normalizeDegrees(value: number): number {
  const wrapped = value % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function snapRotation(degrees: number, shiftKey: boolean): number {
  if (!shiftKey) {
    return normalizeDegrees(degrees);
  }
  return normalizeDegrees(Math.round(degrees / 15) * 15);
}

export function MosaicView({ mosaic, layers, selected, interactive, onSelect, onChange }: Props) {
  const dragRef = useRef<DragState | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const mosaicRef = useRef(mosaic);
  mosaicRef.current = mosaic;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paintTokenRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const token = ++paintTokenRef.current;
    void renderMosaicPreview(canvas, mosaic, layers).then(() => {
      if (token !== paintTokenRef.current) {
        return;
      }
    });
  }, [mosaic, layers]);

  useEffect(() => {
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      const current = mosaicRef.current;

      if (drag.kind === "move") {
        onChangeRef.current({
          x: Math.round(drag.originX + (event.clientX - drag.startX)),
          y: Math.round(drag.originY + (event.clientY - drag.startY)),
        });
        return;
      }

      if (drag.kind === "rotate") {
        const pointerAngle = (Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180) / Math.PI;
        onChangeRef.current({
          rotation: snapRotation(drag.originRotation + (pointerAngle - drag.startAngle), event.shiftKey),
        });
        return;
      }

      const distance = Math.hypot(event.clientX - drag.centerX, event.clientY - drag.centerY);
      const scale = distance / drag.startDistance;
      const nextWidth = Math.max(24, Math.round(drag.startWidth * scale));
      const nextHeight = Math.max(24, Math.round(drag.startHeight * scale));
      onChangeRef.current({
        width: nextWidth,
        height: nextHeight,
        x: Math.round(drag.centerX - nextWidth / 2),
        y: Math.round(drag.centerY - nextHeight / 2),
        rotation: current.rotation,
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
      originX: mosaic.x,
      originY: mosaic.y,
    };
  };

  const onResizePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (!interactive) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    onSelect();
    const centerX = mosaic.x + mosaic.width / 2;
    const centerY = mosaic.y + mosaic.height / 2;
    dragRef.current = {
      kind: "resize",
      pointerId: event.pointerId,
      centerX,
      centerY,
      startDistance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
      startWidth: mosaic.width,
      startHeight: mosaic.height,
    };
  };

  const onRotatePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!interactive) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    onSelect();
    const centerX = mosaic.x + mosaic.width / 2;
    const centerY = mosaic.y + mosaic.height / 2;
    const pointerAngle = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
    dragRef.current = {
      kind: "rotate",
      pointerId: event.pointerId,
      centerX,
      centerY,
      startAngle: pointerAngle,
      originRotation: mosaic.rotation,
    };
  };

  return (
    <div
      data-mosaic-id={mosaic.id}
      className={cn(
        "absolute touch-none",
        interactive ? "pointer-events-auto cursor-move" : "pointer-events-none",
      )}
      style={{
        left: mosaic.x,
        top: mosaic.y,
        width: mosaic.width,
        height: mosaic.height,
        zIndex: 3850,
        transform: `rotate(${mosaic.rotation}deg)`,
        transformOrigin: "center center",
      }}
      onPointerDown={onMovePointerDown}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <canvas ref={canvasRef} className="block size-full" />
      </div>

      {selected && interactive && (
        <>
          <div className="pointer-events-none absolute inset-0 outline outline-2 outline-[var(--brand)] outline-offset-1" />
          <div className="pointer-events-none absolute top-0 left-1/2 h-6 w-px -translate-x-1/2 -translate-y-full bg-[var(--brand)]" />
          <button
            type="button"
            aria-label="回転"
            title="ドラッグで回転（Shift で 15° 刻み）"
            className="absolute top-0 left-1/2 flex size-7 -translate-x-1/2 -translate-y-[calc(100%+10px)] cursor-grab items-center justify-center rounded-full border-2 border-white bg-[var(--brand)] text-[var(--brand-foreground)] shadow-md active:cursor-grabbing"
            onPointerDown={onRotatePointerDown}
          >
            <RotateCw className="size-3.5" />
          </button>
          <span
            className="absolute -top-1.5 -left-1.5 size-3 cursor-nwse-resize rounded-sm border-2 border-white bg-[var(--brand)]"
            onPointerDown={onResizePointerDown}
          />
          <span
            className="absolute -top-1.5 -right-1.5 size-3 cursor-nesw-resize rounded-sm border-2 border-white bg-[var(--brand)]"
            onPointerDown={onResizePointerDown}
          />
          <span
            className="absolute -bottom-1.5 -left-1.5 size-3 cursor-nesw-resize rounded-sm border-2 border-white bg-[var(--brand)]"
            onPointerDown={onResizePointerDown}
          />
          <span
            className="absolute -right-1.5 -bottom-1.5 size-3 cursor-nwse-resize rounded-sm border-2 border-white bg-[var(--brand)]"
            onPointerDown={onResizePointerDown}
          />
        </>
      )}
    </div>
  );
}
