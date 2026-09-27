import { useEffect, useRef, type PointerEvent } from "react";
import { SELECTION_CHROME_Z } from "@/components/BoxSelectionChrome";
import type { ArrowAnnotation, ArrowPatch } from "@/editor/types";
import { arrowHeadPoints } from "@/editor/arrowGeometry";
import { cn } from "@/lib/utils";

/** 矢印表示コンポーネントのプロパティ。 */
type Props = {
  arrow: ArrowAnnotation;
  selected?: boolean;
  interactive: boolean;
  onSelect: () => void;
  onChange: (patch: ArrowPatch) => void;
};

/** 矢印全体の移動ドラッグ状態。 */
type DragState = {
  kind: "move";
  pointerId: number;
  startX: number;
  startY: number;
  origin: ArrowAnnotation;
};

/**
 * キャンバス上に矢印注釈を描画し、選択・移動操作を扱う。
 * @param props 矢印データと操作コールバック
 * @returns {JSX.Element} 矢印 SVG
 */
export function ArrowView({ arrow, selected = false, interactive, onSelect, onChange }: Props) {
  const dragRef = useRef<DragState | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [tip, left, right] = arrowHeadPoints(arrow);
  const minX = Math.min(arrow.x1, arrow.x2, left.x, right.x) - 12;
  const minY = Math.min(arrow.y1, arrow.y2, left.y, right.y) - 12;
  const width = Math.max(24, Math.max(arrow.x1, arrow.x2, left.x, right.x) - minX + 12);
  const height = Math.max(24, Math.max(arrow.y1, arrow.y2, left.y, right.y) - minY + 12);

  const toLocal = (x: number, y: number) => ({ x: x - minX, y: y - minY });
  const p1 = toLocal(arrow.x1, arrow.y1);
  const head = [tip, left, right].map((point) => toLocal(point.x, point.y));

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
      origin: { ...arrow },
    };
  };

  const dx = arrow.x2 - arrow.x1;
  const dy = arrow.y2 - arrow.y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  const headLength = Math.max(12, arrow.strokeWidth * 3.2);
  const shaftEnd = toLocal(
    arrow.x1 + (dx / length) * Math.max(0, length - headLength * 0.85),
    arrow.y1 + (dy / length) * Math.max(0, length - headLength * 0.85),
  );

  return (
    <svg
      data-arrow-id={arrow.id}
      className={cn("absolute overflow-visible", interactive ? "pointer-events-auto" : "pointer-events-none")}
      style={{ left: minX, top: minY, width, height, zIndex: selected ? SELECTION_CHROME_Z - 1 : 4000 }}
    >
      <line
        x1={p1.x}
        y1={p1.y}
        x2={toLocal(arrow.x2, arrow.y2).x}
        y2={toLocal(arrow.x2, arrow.y2).y}
        stroke="transparent"
        strokeWidth={Math.max(20, arrow.strokeWidth + 16)}
        strokeLinecap="round"
        className={interactive ? "cursor-move" : undefined}
        onPointerDown={onMovePointerDown}
      />
      <polygon
        points={head.map((point) => `${point.x},${point.y}`).join(" ")}
        fill="transparent"
        className={interactive ? "cursor-move" : undefined}
        onPointerDown={onMovePointerDown}
      />
      <line
        x1={p1.x}
        y1={p1.y}
        x2={shaftEnd.x}
        y2={shaftEnd.y}
        stroke={arrow.color}
        strokeWidth={arrow.strokeWidth}
        strokeLinecap="round"
        className="pointer-events-none"
      />
      <polygon
        points={head.map((point) => `${point.x},${point.y}`).join(" ")}
        fill={arrow.color}
        className="pointer-events-none"
      />
    </svg>
  );
}
