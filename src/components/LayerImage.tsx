import { useRef, type PointerEvent } from "react";
import { CropOverlay } from "@/components/CropOverlay";
import { cn } from "@/lib/utils";
import type { CropRect, ImageLayer, LayerPatch } from "@/editor/types";

type Props = {
  layer: ImageLayer;
  selected: boolean;
  cropping: boolean;
  crop: CropRect | null;
  zIndex: number;
  onSelect: () => void;
  onChange: (patch: LayerPatch) => void;
  onCropChange: (crop: CropRect) => void;
};

type DragState = {
  kind: "move";
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export function LayerImage({
  layer,
  selected: _selected,
  cropping,
  crop,
  zIndex,
  onSelect,
  onChange,
  onCropChange,
}: Props) {
  const dragRef = useRef<DragState | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    onSelect();
    if (cropping) {
      return;
    }
    dragRef.current = {
      kind: "move",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
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
    onChange({
      x: Math.round(drag.originX + (event.clientX - drag.startX)),
      y: Math.round(drag.originY + (event.clientY - drag.startY)),
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
      className={cn(
        "absolute touch-none drop-shadow-[0_10px_18px_rgb(0_0_0_/_22%)]",
        cropping ? "cursor-default" : "cursor-grab active:cursor-grabbing",
      )}
      style={{
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        zIndex: cropping ? zIndex + 1000 : zIndex,
        transform: `rotate(${layer.rotation}deg)`,
        transformOrigin: "center center",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img className="pointer-events-none block size-full" src={layer.src} alt={layer.name} draggable={false} />

      {cropping && crop && (
        <CropOverlay
          crop={crop}
          layerWidth={layer.width}
          layerHeight={layer.height}
          onChange={onCropChange}
        />
      )}
    </div>
  );
}
