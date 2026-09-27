import { useEffect, useRef, type PointerEvent } from "react";
import { SELECTION_CHROME_Z } from "@/components/BoxSelectionChrome";
import { renderMosaicPreview } from "@/editor/mosaicGeometry";
import type { ImageLayer, MosaicAnnotation, MosaicPatch } from "@/editor/types";
import { cn } from "@/lib/utils";

/** モザイク表示コンポーネントのプロパティ。 */
type Props = {
  mosaic: MosaicAnnotation;
  layers: ImageLayer[];
  selected?: boolean;
  interactive: boolean;
  onSelect: () => void;
  onChange: (patch: MosaicPatch) => void;
};

/** モザイク移動のドラッグ状態。 */
type DragState = {
  kind: "move";
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

/**
 * キャンバス上にモザイク注釈を描画し、選択・移動を扱う。
 * @param props モザイクデータと操作コールバック
 * @returns {JSX.Element} モザイク表示
 */
export function MosaicView({ mosaic, layers, selected = false, interactive, onSelect, onChange }: Props) {
  const dragRef = useRef<DragState | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
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
      originX: mosaic.x,
      originY: mosaic.y,
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
        zIndex: selected ? SELECTION_CHROME_Z - 1 : 3850,
        transform: `rotate(${mosaic.rotation}deg)`,
        transformOrigin: "center center",
      }}
      onPointerDown={onMovePointerDown}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <canvas ref={canvasRef} className="block size-full" />
      </div>
    </div>
  );
}
