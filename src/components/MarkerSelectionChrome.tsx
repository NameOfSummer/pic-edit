import { useRef, type PointerEvent } from "react";
import { RotateCw } from "lucide-react";
import { SELECTION_CHROME_Z } from "@/components/BoxSelectionChrome";
import { applyBoxResize, BOX_RESIZE_HANDLES, type ResizeHandle } from "@/editor/boxResize";
import { rotateMarkerEndpoints } from "@/editor/markerGeometry";
import type { MarkerAnnotation, MarkerPatch } from "@/editor/types";
import { cn } from "@/lib/utils";

type Props = {
  marker: MarkerAnnotation;
  onChange: (patch: MarkerPatch) => void;
};

type DragState =
  | {
      kind: "resize";
      pointerId: number;
      handle: ResizeHandle;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
      originWidth: number;
      originHeight: number;
      angle: number;
      moreHorizontal: boolean;
    }
  | {
      kind: "rotate";
      pointerId: number;
      centerX: number;
      centerY: number;
      startAngle: number;
      origin: MarkerAnnotation;
    };

/** マーカー本体とハンドルのあいだの余白 */
const CHROME_PAD = 16;
const MIN_STROKE = 8;
const MAX_STROKE = 64;
const MIN_LENGTH = 24;

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 線＋太さを含むインク領域（クローム余白なし） */
function markerInkBox(marker: MarkerAnnotation) {
  const half = marker.strokeWidth / 2;
  const minX = Math.min(marker.x1, marker.x2);
  const minY = Math.min(marker.y1, marker.y2);
  const maxX = Math.max(marker.x1, marker.x2);
  const maxY = Math.max(marker.y1, marker.y2);
  return {
    x: minX - half,
    y: minY - half,
    width: Math.max(marker.strokeWidth, maxX - minX + marker.strokeWidth),
    height: Math.max(marker.strokeWidth, maxY - minY + marker.strokeWidth),
  };
}

function markerChromeBox(marker: MarkerAnnotation) {
  const ink = markerInkBox(marker);
  return {
    x: ink.x - CHROME_PAD,
    y: ink.y - CHROME_PAD,
    width: ink.width + CHROME_PAD * 2,
    height: ink.height + CHROME_PAD * 2,
  };
}

function chromeBoxToMarkerPatch(
  box: { x: number; y: number; width: number; height: number },
  angle: number,
  moreHorizontal: boolean,
): MarkerPatch {
  const inkW = Math.max(MIN_STROKE, box.width - CHROME_PAD * 2);
  const inkH = Math.max(MIN_STROKE, box.height - CHROME_PAD * 2);
  const cx = box.x + CHROME_PAD + inkW / 2;
  const cy = box.y + CHROME_PAD + inkH / 2;

  let stroke: number;
  let length: number;
  if (moreHorizontal) {
    stroke = clamp(inkH, MIN_STROKE, MAX_STROKE);
    length = Math.max(MIN_LENGTH, inkW - stroke);
  } else {
    stroke = clamp(inkW, MIN_STROKE, MAX_STROKE);
    length = Math.max(MIN_LENGTH, inkH - stroke);
  }

  const half = length / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x1: Math.round(cx - cos * half),
    y1: Math.round(cy - sin * half),
    x2: Math.round(cx + cos * half),
    y2: Math.round(cy + sin * half),
    strokeWidth: Math.round(stroke),
  };
}

/** マーカーの選択枠・回転・リサイズ。注釈本体より前面に重ねる。 */
export function MarkerSelectionChrome({ marker, onChange }: Props) {
  const dragRef = useRef<DragState | null>(null);
  const chrome = markerChromeBox(marker);
  const cx = (marker.x1 + marker.x2) / 2;
  const cy = (marker.y1 + marker.y2) / 2;
  const angle = Math.atan2(marker.y2 - marker.y1, marker.x2 - marker.x1);
  const moreHorizontal = Math.abs(Math.cos(angle)) >= Math.abs(Math.sin(angle));

  const onResizePointerDown = (handle: ResizeHandle) => (event: PointerEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    event.preventDefault();
    dragRef.current = {
      kind: "resize",
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      originX: chrome.x,
      originY: chrome.y,
      originWidth: chrome.width,
      originHeight: chrome.height,
      angle,
      moreHorizontal,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onRotatePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const pointerAngle = (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI;
    dragRef.current = {
      kind: "rotate",
      pointerId: event.pointerId,
      centerX: cx,
      centerY: cy,
      startAngle: pointerAngle,
      origin: { ...marker },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();

    if (drag.kind === "rotate") {
      const pointerAngle = (Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180) / Math.PI;
      const delta = snapRotation(pointerAngle - drag.startAngle, event.shiftKey);
      onChange(rotateMarkerEndpoints(drag.origin, normalizeDegrees(delta)));
      return;
    }

    const minWidth = drag.moreHorizontal
      ? CHROME_PAD * 2 + MIN_STROKE + MIN_LENGTH
      : CHROME_PAD * 2 + MIN_STROKE;
    const minHeight = drag.moreHorizontal
      ? CHROME_PAD * 2 + MIN_STROKE
      : CHROME_PAD * 2 + MIN_STROKE + MIN_LENGTH;

    const box = applyBoxResize({
      handle: drag.handle,
      origin: {
        x: drag.originX,
        y: drag.originY,
        width: drag.originWidth,
        height: drag.originHeight,
      },
      localDx: event.clientX - drag.startX,
      localDy: event.clientY - drag.startY,
      minWidth,
      minHeight,
    });
    onChange(chromeBoxToMarkerPatch(box, drag.angle, drag.moreHorizontal));
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: SELECTION_CHROME_Z }}>
      <div
        className="pointer-events-none absolute outline outline-2 outline-[var(--brand)]"
        style={{
          left: chrome.x,
          top: chrome.y,
          width: chrome.width,
          height: chrome.height,
        }}
      />
      <button
        type="button"
        aria-label="回転"
        title="ドラッグで回転（Shift で 15° 刻み）"
        className="pointer-events-auto absolute flex size-7 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-[var(--brand)] text-[var(--brand-foreground)] shadow-md active:cursor-grabbing"
        style={{
          left: chrome.x + chrome.width / 2,
          top: chrome.y - 18,
        }}
        onPointerDown={onRotatePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <RotateCw className="size-3.5" />
      </button>
      <div
        className="absolute"
        style={{
          left: chrome.x,
          top: chrome.y,
          width: chrome.width,
          height: chrome.height,
        }}
      >
        {BOX_RESIZE_HANDLES.map((handle) => (
          <span
            key={handle.id}
            aria-label={`リサイズ ${handle.id}`}
            title="ドラッグで長さ・太さを変更"
            className={cn(
              "pointer-events-auto absolute size-3 rounded-sm border-2 border-white bg-[var(--brand)]",
              handle.className,
            )}
            onPointerDown={onResizePointerDown(handle.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        ))}
      </div>
    </div>
  );
}
