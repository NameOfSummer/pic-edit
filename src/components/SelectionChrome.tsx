import { useRef, type PointerEvent } from "react";
import { RotateCw } from "lucide-react";
import type { ImageLayer, LayerPatch } from "@/editor/types";

type Props = {
  layer: ImageLayer;
  onChange: (patch: LayerPatch) => void;
};

type DragState =
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

/** 選択枠・回転・リサイズ。重ね順とは独立して最前面表示。
 *  本体はクリック透過し、ハンドルだけ操作可能（注釈への選択切り替えを妨げない）。 */
export function SelectionChrome({ layer, onChange }: Props) {
  const dragRef = useRef<DragState | null>(null);

  const onResizePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;
    const startDistance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
    dragRef.current = {
      kind: "resize",
      pointerId: event.pointerId,
      centerX,
      centerY,
      startDistance: Math.max(1, startDistance),
      startWidth: layer.width,
      startHeight: layer.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onRotatePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;
    const pointerAngle = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
    dragRef.current = {
      kind: "rotate",
      pointerId: event.pointerId,
      centerX,
      centerY,
      startAngle: pointerAngle,
      originRotation: layer.rotation,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (drag.kind === "rotate") {
      const pointerAngle = (Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180) / Math.PI;
      const next = drag.originRotation + (pointerAngle - drag.startAngle);
      onChange({ rotation: snapRotation(next, event.shiftKey) });
      return;
    }

    const distance = Math.hypot(event.clientX - drag.centerX, event.clientY - drag.centerY);
    const scale = distance / drag.startDistance;
    const nextWidth = Math.max(48, Math.round(drag.startWidth * scale));
    const nextHeight = Math.max(48, Math.round(drag.startHeight * scale));
    onChange({
      width: nextWidth,
      height: nextHeight,
      x: Math.round(drag.centerX - nextWidth / 2),
      y: Math.round(drag.centerY - nextHeight / 2),
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <div
      data-layer-id={layer.id}
      className="pointer-events-none absolute"
      style={{
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        zIndex: 5000,
        transform: `rotate(${layer.rotation}deg)`,
        transformOrigin: "center center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 outline outline-2 outline-ring" />

      <div className="pointer-events-none absolute top-0 left-1/2 h-6 w-px -translate-x-1/2 -translate-y-full bg-ring" />
      <button
        type="button"
        aria-label="回転"
        title="ドラッグで回転（Shift で 15° 刻み）"
        className="pointer-events-auto absolute top-0 left-1/2 flex size-7 -translate-x-1/2 -translate-y-[calc(100%+10px)] cursor-grab items-center justify-center rounded-full border-2 border-background bg-ring text-[var(--brand-foreground)] shadow-md active:cursor-grabbing"
        onPointerDown={onRotatePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <RotateCw className="size-3.5" />
      </button>

      <span
        className="pointer-events-auto absolute -top-1.5 -left-1.5 size-3 cursor-nwse-resize rounded-sm border-2 border-background bg-ring"
        onPointerDown={onResizePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <span
        className="pointer-events-auto absolute -top-1.5 -right-1.5 size-3 cursor-nesw-resize rounded-sm border-2 border-background bg-ring"
        onPointerDown={onResizePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <span
        className="pointer-events-auto absolute -bottom-1.5 -left-1.5 size-3 cursor-nesw-resize rounded-sm border-2 border-background bg-ring"
        onPointerDown={onResizePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <span
        className="pointer-events-auto absolute -right-1.5 -bottom-1.5 size-3 cursor-nwse-resize rounded-sm border-2 border-background bg-ring"
        onPointerDown={onResizePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
