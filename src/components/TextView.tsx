import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { RotateCw } from "lucide-react";
import { measureTextBox } from "@/editor/textGeometry";
import { TEXT_FONT_FAMILY, type TextAnnotation, type TextPatch } from "@/editor/types";
import { cn } from "@/lib/utils";

type Props = {
  text: TextAnnotation;
  selected: boolean;
  interactive: boolean;
  editing: boolean;
  onSelect: () => void;
  onChange: (patch: TextPatch) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
};

type DragState =
  | { kind: "move"; pointerId: number; startX: number; startY: number; originX: number; originY: number }
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

export function TextView({
  text,
  selected,
  interactive,
  editing,
  onSelect,
  onChange,
  onStartEdit,
  onEndEdit,
}: Props) {
  const dragRef = useRef<DragState | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const editorRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState(() => measureTextBox(text));

  useLayoutEffect(() => {
    setBox(measureTextBox(text));
  }, [text.text, text.fontSize, text.fontWeight]);

  useEffect(() => {
    if (!editing || !editorRef.current) {
      return;
    }
    const node = editorRef.current;
    node.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [editing]);

  useEffect(() => {
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      if (drag.kind === "move") {
        onChangeRef.current({
          x: Math.round(drag.originX + (event.clientX - drag.startX)),
          y: Math.round(drag.originY + (event.clientY - drag.startY)),
        });
        return;
      }
      const pointerAngle = (Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180) / Math.PI;
      onChangeRef.current({
        rotation: snapRotation(drag.originRotation + (pointerAngle - drag.startAngle), event.shiftKey),
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
    if (!interactive || editing) {
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
      originX: text.x,
      originY: text.y,
    };
  };

  const onRotatePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!interactive || editing) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    onSelect();
    const centerX = text.x + box.width / 2;
    const centerY = text.y + box.height / 2;
    const pointerAngle = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
    dragRef.current = {
      kind: "rotate",
      pointerId: event.pointerId,
      centerX,
      centerY,
      startAngle: pointerAngle,
      originRotation: text.rotation,
    };
  };

  const commitEdit = () => {
    const raw = editorRef.current?.innerText ?? text.text;
    const next = raw.replace(/\u00a0/g, " ").replace(/\n$/, "");
    onChange({ text: next.length > 0 ? next : " " });
    onEndEdit();
  };

  return (
    <div
      data-text-id={text.id}
      className={cn(
        "absolute touch-none",
        interactive && !editing ? "pointer-events-auto cursor-move" : "pointer-events-auto",
      )}
      style={{
        left: text.x,
        top: text.y,
        width: Math.max(box.width, 24),
        height: Math.max(box.height, text.fontSize),
        zIndex: 3950,
        transform: `rotate(${text.rotation}deg)`,
        transformOrigin: "center center",
      }}
      onPointerDown={onMovePointerDown}
      onDoubleClick={(event) => {
        if (!interactive) {
          return;
        }
        event.stopPropagation();
        onSelect();
        onStartEdit();
      }}
    >
      {editing ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-w-[1em] whitespace-pre-wrap break-words outline-none"
          style={{
            color: text.color,
            fontFamily: TEXT_FONT_FAMILY,
            fontSize: text.fontSize,
            fontWeight: text.fontWeight === "bold" ? 700 : 400,
            lineHeight: 1.25,
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onBlur={commitEdit}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              commitEdit();
            }
          }}
        >
          {text.text}
        </div>
      ) : (
        <div
          className="whitespace-pre-wrap break-words"
          style={{
            color: text.color,
            fontFamily: TEXT_FONT_FAMILY,
            fontSize: text.fontSize,
            fontWeight: text.fontWeight === "bold" ? 700 : 400,
            lineHeight: 1.25,
          }}
        >
          {text.text}
        </div>
      )}

      {selected && interactive && !editing && (
        <>
          <div className="pointer-events-none absolute inset-0 outline outline-2 outline-[var(--brand)] outline-offset-2" />
          <div className="pointer-events-none absolute top-0 left-1/2 h-6 w-px -translate-x-1/2 -translate-y-full bg-[var(--brand)]" />
          <button
            type="button"
            aria-label="回転"
            title="ドラッグで回転（Shift で 15° 刻み）"
            className="absolute top-0 left-1/2 flex size-7 -translate-x-1/2 -translate-y-[calc(100%+10px)] cursor-grab items-center justify-center rounded-full border-2 border-white bg-[var(--brand)] text-[var(--brand-foreground)] shadow-md active:cursor-grabbing"
            onPointerDown={onRotatePointerDown}
          >
            <RotateCw className="size-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
