import { useRef, type PointerEvent } from "react";
import { RotateCw } from "lucide-react";
import {
  applyBoxResize,
  BOX_RESIZE_HANDLES,
  screenDeltaToLocal,
  type ResizeHandle,
} from "@/editor/boxResize";
import { cn } from "@/lib/utils";

/** 選択クロームを注釈本体より前面に重ねるための z-index。 */
export const SELECTION_CHROME_Z = 10000;

/** 矩形系選択クロームのプロパティ。 */
type Props = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  minWidth?: number;
  minHeight?: number;
  showRotate?: boolean;
  onChange: (patch: { x: number; y: number; width: number; height: number } | { rotation: number }) => void;
};

/** リサイズまたは回転のドラッグ状態。 */
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
      rotation: number;
    }
  | {
      kind: "rotate";
      pointerId: number;
      centerX: number;
      centerY: number;
      startAngle: number;
      originRotation: number;
    };

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
 * 選択枠・回転・辺/角リサイズ。本体より前面に重ね、ハンドルだけ操作可能。
 * @param props 対象矩形の位置・サイズと変更コールバック
 * @returns {JSX.Element} 選択クローム UI
 */
export function BoxSelectionChrome({
  x,
  y,
  width,
  height,
  rotation,
  minWidth = 24,
  minHeight = 24,
  showRotate = true,
  onChange,
}: Props) {
  const dragRef = useRef<DragState | null>(null);

  const onResizePointerDown = (handle: ResizeHandle) => (event: PointerEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    event.preventDefault();
    dragRef.current = {
      kind: "resize",
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      originX: x,
      originY: y,
      originWidth: width,
      originHeight: height,
      rotation,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onRotatePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const pointerAngle = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
    dragRef.current = {
      kind: "rotate",
      pointerId: event.pointerId,
      centerX,
      centerY,
      startAngle: pointerAngle,
      originRotation: rotation,
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
      onChange({
        rotation: snapRotation(drag.originRotation + (pointerAngle - drag.startAngle), event.shiftKey),
      });
      return;
    }

    const local = screenDeltaToLocal(event.clientX - drag.startX, event.clientY - drag.startY, drag.rotation);
    onChange(
      applyBoxResize({
        handle: drag.handle,
        origin: {
          x: drag.originX,
          y: drag.originY,
          width: drag.originWidth,
          height: drag.originHeight,
        },
        localDx: local.x,
        localDy: local.y,
        minWidth,
        minHeight,
      }),
    );
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
        left: x,
        top: y,
        width,
        height,
        zIndex: SELECTION_CHROME_Z,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 outline outline-2 outline-[var(--brand)] outline-offset-2" />

      {showRotate && (
        <>
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
        </>
      )}

      {BOX_RESIZE_HANDLES.map((handle) => (
        <span
          key={handle.id}
          aria-label={`リサイズ ${handle.id}`}
          title="ドラッグで幅・高さを変更"
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
