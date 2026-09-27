import { useEffect, useRef, type PointerEvent } from "react";
import type { SceneColorSampler } from "@/editor/eyedropper";

/** スポイトオーバーレイのプロパティ。 */
type Props = {
  sampler: SceneColorSampler;
  previewColor: string | null;
  onPreview: (color: string | null) => void;
  onPick: (color: string) => void;
  onCancel: () => void;
};

/**
 * 全画面オーバーレイでキャンバス上の色をスポイトする。
 * @param props サンプラーとプレビュー／確定／キャンセルコールバック
 * @returns {JSX.Element} スポイト UI
 */
export function EyedropperOverlay({
  sampler,
  previewColor,
  onPreview,
  onPick,
  onCancel,
}: Props) {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const moveLoupe = (clientX: number, clientY: number) => {
    const el = cursorRef.current;
    if (!el) return;
    el.style.transform = `translate(${clientX + 16}px, ${clientY + 16}px)`;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    moveLoupe(event.clientX, event.clientY);
    onPreview(sampler.sample(event.clientX, event.clientY));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const color = sampler.sample(event.clientX, event.clientY);
    if (color) {
      onPick(color);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[12000] cursor-crosshair"
      role="dialog"
      aria-label="スポイトで色を選択。Esc でキャンセル"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onContextMenu={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <div
        ref={cursorRef}
        className="pointer-events-none fixed left-0 top-0 flex items-center gap-2 rounded-lg border border-black/15 bg-white/95 px-2 py-1.5 shadow-lg"
        style={{ transform: "translate(-9999px, -9999px)" }}
      >
        <span
          className="size-7 rounded-md border border-black/10 shadow-sm"
          style={{ backgroundColor: previewColor ?? "transparent" }}
          aria-hidden
        />
        <span className="font-mono text-[11px] text-[#333]">
          {previewColor?.toUpperCase() ?? "—"}
        </span>
      </div>
      <p className="pointer-events-none fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1.5 text-[11px] text-white shadow">
        画像や注釈をクリックして色を取得 · Esc でキャンセル
      </p>
    </div>
  );
}
