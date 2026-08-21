import { useRef, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import type { CropRect } from "@/editor/types";

type Handle = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se" | "move";

type Props = {
  crop: CropRect;
  layerWidth: number;
  layerHeight: number;
  onChange: (crop: CropRect) => void;
};

const MIN = 16;

function clampCrop(next: CropRect, layerWidth: number, layerHeight: number): CropRect {
  const width = Math.min(layerWidth, Math.max(MIN, next.width));
  const height = Math.min(layerHeight, Math.max(MIN, next.height));
  const x = Math.min(layerWidth - width, Math.max(0, next.x));
  const y = Math.min(layerHeight - height, Math.max(0, next.y));
  return { x, y, width, height };
}

export function CropOverlay({ crop, layerWidth, layerHeight, onChange }: Props) {
  const dragRef = useRef<{
    handle: Handle;
    pointerId: number;
    startX: number;
    startY: number;
    origin: CropRect;
  } | null>(null);

  const onHandleDown = (handle: Handle) => (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    dragRef.current = {
      handle,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: crop,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const { origin, handle } = drag;
    let next = { ...origin };

    if (handle === "move") {
      next = { ...origin, x: origin.x + dx, y: origin.y + dy };
    } else {
      if (handle.includes("w")) {
        next.x = origin.x + dx;
        next.width = origin.width - dx;
      }
      if (handle.includes("e")) {
        next.width = origin.width + dx;
      }
      if (handle.includes("n")) {
        next.y = origin.y + dy;
        next.height = origin.height - dy;
      }
      if (handle.includes("s")) {
        next.height = origin.height + dy;
      }

      if (next.width < MIN) {
        if (handle.includes("w")) {
          next.x = origin.x + origin.width - MIN;
        }
        next.width = MIN;
      }
      if (next.height < MIN) {
        if (handle.includes("n")) {
          next.y = origin.y + origin.height - MIN;
        }
        next.height = MIN;
      }
    }

    onChange(clampCrop(next, layerWidth, layerHeight));
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const handles: { id: Handle; className: string }[] = [
    { id: "nw", className: "-left-1.5 -top-1.5 cursor-nwse-resize" },
    { id: "ne", className: "-right-1.5 -top-1.5 cursor-nesw-resize" },
    { id: "sw", className: "-left-1.5 -bottom-1.5 cursor-nesw-resize" },
    { id: "se", className: "-right-1.5 -bottom-1.5 cursor-nwse-resize" },
    { id: "n", className: "left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize" },
    { id: "s", className: "left-1/2 -bottom-1.5 -translate-x-1/2 cursor-ns-resize" },
    { id: "w", className: "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
    { id: "e", className: "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
  ];

  return (
    <div className="absolute inset-0 z-[4]">
      <div className="absolute bg-black/45" style={{ left: 0, top: 0, width: layerWidth, height: crop.y }} />
      <div
        className="absolute bg-black/45"
        style={{ left: 0, top: crop.y + crop.height, width: layerWidth, height: layerHeight - crop.y - crop.height }}
      />
      <div className="absolute bg-black/45" style={{ left: 0, top: crop.y, width: crop.x, height: crop.height }} />
      <div
        className="absolute bg-black/45"
        style={{ left: crop.x + crop.width, top: crop.y, width: layerWidth - crop.x - crop.width, height: crop.height }}
      />

      <div
        className="absolute box-border cursor-move border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0_/_35%)]"
        style={{
          left: crop.x,
          top: crop.y,
          width: crop.width,
          height: crop.height,
        }}
        onPointerDown={onHandleDown("move")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="border border-white/20" />
          ))}
        </div>
        {handles.map((handle) => (
          <span
            key={handle.id}
            className={cn("absolute size-3 rounded-sm border-2 border-white bg-ring", handle.className)}
            onPointerDown={onHandleDown(handle.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        ))}
      </div>
    </div>
  );
}
