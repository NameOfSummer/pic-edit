import { useRef, type PointerEvent } from "react";
import type { ImageLayer } from "../editor/types";

type Props = {
  layer: ImageLayer;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Pick<ImageLayer, "x" | "y" | "width" | "height">>) => void;
};

type DragState =
  | { kind: "move"; pointerId: number; offsetX: number; offsetY: number }
  | { kind: "resize"; pointerId: number; startX: number; startY: number; startWidth: number; startHeight: number; originX: number; originY: number };

export function LayerImage({ layer, selected, onSelect, onChange }: Props) {
  const dragRef = useRef<DragState | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    onSelect();
    dragRef.current = {
      kind: "move",
      pointerId: event.pointerId,
      offsetX: event.clientX - layer.x,
      offsetY: event.clientY - layer.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onResizePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    event.preventDefault();
    onSelect();
    dragRef.current = {
      kind: "resize",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: layer.width,
      startHeight: layer.height,
      originX: layer.x,
      originY: layer.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (drag.kind === "move") {
      onChange({
        x: Math.round(event.clientX - drag.offsetX),
        y: Math.round(event.clientY - drag.offsetY),
      });
      return;
    }

    const delta = Math.max(event.clientX - drag.startX, event.clientY - drag.startY);
    const aspect = drag.startWidth / drag.startHeight;
    const nextWidth = Math.max(48, Math.round(drag.startWidth + delta));
    const nextHeight = Math.max(48, Math.round(nextWidth / aspect));
    onChange({
      x: drag.originX,
      y: drag.originY,
      width: nextWidth,
      height: nextHeight,
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <div
      className={selected ? "layer is-selected" : "layer"}
      style={{
        transform: `translate(${layer.x}px, ${layer.y}px)`,
        width: layer.width,
        height: layer.height,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img className="layer-image" src={layer.src} alt={layer.name} draggable={false} />
      {selected && (
        <span
          className="resize-handle"
          onPointerDown={onResizePointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      )}
    </div>
  );
}
