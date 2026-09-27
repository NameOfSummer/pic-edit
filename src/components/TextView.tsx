import { useEffect, useRef, type PointerEvent } from "react";
import { SELECTION_CHROME_Z } from "@/components/BoxSelectionChrome";
import { getTextBoxSize } from "@/editor/textGeometry";
import {
  TEXT_FONT_FAMILY,
  isTransparentBackground,
  type TextAnnotation,
  type TextPatch,
} from "@/editor/types";
import { cn } from "@/lib/utils";

/** テキスト表示コンポーネントのプロパティ。 */
type Props = {
  text: TextAnnotation;
  selected?: boolean;
  interactive: boolean;
  editing: boolean;
  onSelect: () => void;
  onChange: (patch: TextPatch) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
};

/** テキスト移動のドラッグ状態。 */
type DragState = {
  kind: "move";
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

/**
 * キャンバス上にテキスト注釈を描画し、移動とインライン編集を扱う。
 * @param props テキストデータと操作コールバック
 * @returns {JSX.Element} テキスト表示
 */
export function TextView({
  text,
  selected = false,
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
  const box = getTextBoxSize(text);

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

  const commitEdit = () => {
    const raw = editorRef.current?.innerText ?? text.text;
    const next = raw.replace(/\u00a0/g, " ").replace(/\n$/, "");
    onChange({ text: next.length > 0 ? next : " " });
    onEndEdit();
  };

  const textStyle = {
    color: text.color,
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: text.fontSize,
    fontWeight: text.fontWeight === "bold" ? 700 : 400,
    lineHeight: 1.25,
  } as const;

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
        width: box.width,
        height: box.height,
        zIndex: selected ? SELECTION_CHROME_Z - 1 : 3950,
        transform: `rotate(${text.rotation}deg)`,
        transformOrigin: "center center",
        backgroundColor: isTransparentBackground(text.backgroundColor)
          ? "transparent"
          : text.backgroundColor,
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
          className="h-full w-full overflow-hidden whitespace-pre-wrap break-words outline-none"
          style={textStyle}
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
        <div className="h-full w-full overflow-hidden whitespace-pre-wrap break-words" style={textStyle}>
          {text.text}
        </div>
      )}
    </div>
  );
}
