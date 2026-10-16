import { useRef, type PointerEvent } from "react";
import { RotateCw } from "lucide-react";
import { SELECTION_CHROME_Z } from "@/components/BoxSelectionChrome";
import { BOX_RESIZE_HANDLES, screenDeltaToLocal, type ResizeHandle } from "@/editor/boxResize";
import { markerAngleDegrees, markerLength, placeMarkerAtAngle } from "@/editor/markerGeometry";
import type { MarkerAnnotation, MarkerPatch } from "@/editor/types";
import { cn } from "@/lib/utils";

/** マーカー選択クロームのプロパティ。 */
type Props = {
  marker: MarkerAnnotation;
  onChange: (patch: MarkerPatch) => void;
};

/** リサイズまたは回転のドラッグ状態。 */
type DragState =
  | {
      kind: "resize";
      pointerId: number;
      handle: ResizeHandle;
      startX: number;
      startY: number;
      centerX: number;
      centerY: number;
      length: number;
      stroke: number;
      angle: number;
    }
  | {
      kind: "rotate";
      pointerId: number;
      centerX: number;
      centerY: number;
      startAngle: number;
      originAngle: number;
      origin: MarkerAnnotation;
    };

/** マーカー線幅の下限（px）。 */
const MIN_STROKE = 8;
/** マーカー線幅の上限（px）。 */
const MAX_STROKE = 64;
/** マーカー線長の下限（px）。 */
const MIN_LENGTH = 24;

/**
 * 角度を 0〜360 の範囲に正規化する。
 * @param value 入力角度（度）
 * @returns {number} 正規化後の角度
 */
function normalizeDegrees(value: number): number {
  const wrapped = value % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/**
 * Shift 押下時は 15° 刻みにスナップした回転角を返す。
 * @param degrees 生の回転角
 * @param shiftKey Shift キーが押されているか
 * @returns {number} スナップ後の角度
 */
function snapRotation(degrees: number, shiftKey: boolean): number {
  if (!shiftKey) {
    return normalizeDegrees(degrees);
  }
  return normalizeDegrees(Math.round(degrees / 15) * 15);
}

/**
 * 値を指定範囲に収める。
 * @param value 入力値
 * @param min 下限
 * @param max 上限
 * @returns {number} クランプ後の値
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * マーカーの選択枠・回転・リサイズ。線の角度に合わせて枠ごと回す。
 * @param props 対象マーカーと変更コールバック
 * @returns {JSX.Element} 選択クローム UI
 */
export function MarkerSelectionChrome({ marker, onChange }: Props) {
  const dragRef = useRef<DragState | null>(null);
  const length = Math.max(1, markerLength(marker));
  const angle = markerAngleDegrees(marker);
  const centerX = (marker.x1 + marker.x2) / 2;
  const centerY = (marker.y1 + marker.y2) / 2;
  const boxWidth = length;
  const boxHeight = marker.strokeWidth;

  const onResizePointerDown = (handle: ResizeHandle) => (event: PointerEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    event.preventDefault();
    dragRef.current = {
      kind: "resize",
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      centerX,
      centerY,
      length,
      stroke: marker.strokeWidth,
      angle,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onRotatePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const pointerAngle = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
    dragRef.current = {
      kind: "rotate",
      pointerId: event.pointerId,
      centerX,
      centerY,
      startAngle: pointerAngle,
      originAngle: angle,
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
      const next = drag.originAngle + (pointerAngle - drag.startAngle);
      onChange(placeMarkerAtAngle(drag.origin, snapRotation(next, event.shiftKey)));
      return;
    }

    const local = screenDeltaToLocal(event.clientX - drag.startX, event.clientY - drag.startY, drag.angle);
    const handle = drag.handle;
    let lengthDelta = 0;
    let strokeDelta = 0;
    if (handle.includes("e")) {
      lengthDelta += local.x;
    }
    if (handle.includes("w")) {
      lengthDelta -= local.x;
    }
    if (handle.includes("s")) {
      strokeDelta += local.y;
    }
    if (handle.includes("n")) {
      strokeDelta -= local.y;
    }

    const nextLength = Math.max(MIN_LENGTH, drag.length + lengthDelta);
    const nextStroke = clamp(drag.stroke + strokeDelta, MIN_STROKE, MAX_STROKE);
    const appliedLength = nextLength - drag.length;
    const appliedStroke = nextStroke - drag.stroke;
    let localCx = 0;
    let localCy = 0;
    if (handle.includes("e")) {
      localCx += appliedLength / 2;
    }
    if (handle.includes("w")) {
      localCx -= appliedLength / 2;
    }
    if (handle.includes("s")) {
      localCy += appliedStroke / 2;
    }
    if (handle.includes("n")) {
      localCy -= appliedStroke / 2;
    }

    const radians = (drag.angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const nextCenterX = drag.centerX + localCx * cos - localCy * sin;
    const nextCenterY = drag.centerY + localCx * sin + localCy * cos;
    const half = nextLength / 2;
    onChange({
      x1: Math.round(nextCenterX - cos * half),
      y1: Math.round(nextCenterY - sin * half),
      x2: Math.round(nextCenterX + cos * half),
      y2: Math.round(nextCenterY + sin * half),
      strokeWidth: Math.round(nextStroke),
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: centerX - boxWidth / 2,
        top: centerY - boxHeight / 2,
        width: boxWidth,
        height: boxHeight,
        zIndex: SELECTION_CHROME_Z,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "center center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 outline outline-2 outline-[var(--brand)] outline-offset-2" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-6 w-px -translate-x-1/2 -translate-y-full bg-[var(--brand)]" />
      <button
        type="button"
        aria-label="回転"
        title="ドラッグで回転（Shift で 15° 刻み）"
        className="pointer-events-auto absolute top-0 left-1/2 flex size-7 -translate-x-1/2 -translate-y-[calc(100%+10px)] cursor-grab items-center justify-center rounded-full border-2 border-white bg-[var(--brand)] text-[var(--brand-foreground)] shadow-md active:cursor-grabbing"
        onPointerDown={onRotatePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <RotateCw className="size-3.5" />
      </button>
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
  );
}
