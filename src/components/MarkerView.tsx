import { useEffect, useRef, type PointerEvent } from "react";
import { SELECTION_CHROME_Z } from "@/components/BoxSelectionChrome";
import { MARKER_OPACITY, type MarkerAnnotation, type MarkerPatch } from "@/editor/types";
import { cn } from "@/lib/utils";

/** マーカー表示コンポーネントのプロパティ。 */
type Props = {
  marker: MarkerAnnotation;
  selected?: boolean;
  interactive: boolean;
  onSelect: () => void;
  onChange: (patch: MarkerPatch) => void;
};

/** マーカー移動のドラッグ状態。 */
type DragState = {
  kind: "move";
  pointerId: number;
  startX: number;
  startY: number;
  origin: MarkerAnnotation;
};

/**
 * キャンバス上にマーカー注釈を描画し、選択・移動を扱う。
 * @param props マーカーデータと操作コールバック
 * @returns {JSX.Element} マーカー表示
 */
export function MarkerView({ marker, selected = false, interactive, onSelect, onChange }: Props) {
  const dragRef = useRef<DragState | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pad = marker.strokeWidth / 2 + 8;
  const minX = Math.min(marker.x1, marker.x2) - pad;
  const minY = Math.min(marker.y1, marker.y2) - pad;
  const width = Math.max(marker.strokeWidth + 16, Math.abs(marker.x2 - marker.x1) + pad * 2);
  const height = Math.max(marker.strokeWidth + 16, Math.abs(marker.y2 - marker.y1) + pad * 2);

  useEffect(() => {
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      onChangeRef.current({
        x1: Math.round(drag.origin.x1 + dx),
        y1: Math.round(drag.origin.y1 + dy),
        x2: Math.round(drag.origin.x2 + dx),
        y2: Math.round(drag.origin.y2 + dy),
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

  return (
    <div
      data-marker-id={marker.id}
      className={cn("absolute", interactive ? "pointer-events-auto" : "pointer-events-none")}
      style={{ left: minX, top: minY, width, height, zIndex: selected ? SELECTION_CHROME_Z - 1 : 3870 }}
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
    </div>
  );
}
