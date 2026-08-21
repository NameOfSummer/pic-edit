import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { LayerImage } from "./LayerImage";
import { Toolbar } from "./Toolbar";
import { collectClipboardImages, collectImageFiles } from "../editor/images";
import { useLayers } from "../editor/useLayers";

export function Editor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const { layers, selectedId, setSelectedId, addFiles, updateLayer, bringToFront, removeSelected } = useLayers();

  const placeFiles = useCallback(
    async (files: File[], origin?: { x: number; y: number }) => {
      await addFiles(files, origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    },
    [addFiles],
  );

  const onDragEnter = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    if (hasImagePayload(event.dataTransfer)) {
      setIsDragOver(true);
    }
  };

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const onDrop = async (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragOver(false);
    const files = collectImageFiles(event.dataTransfer.files);
    await placeFiles(files, { x: event.clientX, y: event.clientY });
  };

  const onPickFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = collectImageFiles(event.target.files);
    await placeFiles(files);
    event.target.value = "";
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      void (async () => {
        const files = await collectClipboardImages(event.clipboardData);
        if (files.length === 0) {
          return;
        }
        event.preventDefault();
        await placeFiles(files);
      })();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId(null);
        return;
      }
      if ((event.key === "Backspace" || event.key === "Delete") && selectedId) {
        const target = event.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          return;
        }
        event.preventDefault();
        removeSelected();
      }
    };

    window.addEventListener("paste", onPaste);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [placeFiles, removeSelected, selectedId, setSelectedId]);

  return (
    <main
      className={isDragOver ? "editor is-dragover" : "editor"}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onPointerDown={() => setSelectedId(null)}
    >
      <div className="checkerboard" aria-hidden="true" />

      {layers.length === 0 && (
        <div className="empty-hint">
          <p className="empty-hint-title">画像を配置</p>
          <p className="empty-hint-body">
            ドラッグ＆ドロップ、または <kbd>⌘V</kbd> / <kbd>Ctrl+V</kbd> で貼り付け
          </p>
        </div>
      )}

      {layers.map((layer) => (
        <LayerImage
          key={layer.id}
          layer={layer}
          selected={layer.id === selectedId}
          onSelect={() => bringToFront(layer.id)}
          onChange={(patch) => updateLayer(layer.id, patch)}
        />
      ))}

      <Toolbar
        canDelete={Boolean(selectedId)}
        onAdd={() => fileInputRef.current?.click()}
        onDelete={removeSelected}
      />

      <input
        ref={fileInputRef}
        className="file-input"
        type="file"
        accept="image/*"
        multiple
        onChange={onPickFiles}
      />
    </main>
  );
}

function hasImagePayload(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).some((type) => type === "Files" || type.startsWith("image/"));
}
