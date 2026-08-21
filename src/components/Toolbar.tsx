import { type ReactNode } from "react";
import {
  Check,
  Copy,
  Download,
  Grid2x2,
  Highlighter,
  ImagePlus,
  ListOrdered,
  MoveUpRight,
  Redo2,
  RotateCcw,
  Square,
  Type,
  Undo2,
  X,
} from "lucide-react";
import { AnnotationStyleControls } from "@/components/AnnotationStyleControls";
import { CounterStyleControls } from "@/components/CounterStyleControls";
import { MarkerStyleControls } from "@/components/MarkerStyleControls";
import { MosaicStyleControls } from "@/components/MosaicStyleControls";
import { TextStyleControls } from "@/components/TextStyleControls";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AnnotationStyle, CounterStyle, EditorTool, MarkerStyle, MosaicStyle, TextStyle } from "@/editor/types";

type Props = {
  cropping: boolean;
  canExport: boolean;
  exporting: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canReset: boolean;
  tool: EditorTool;
  showStrokeStyle: boolean;
  showTextStyle: boolean;
  showCounterStyle: boolean;
  showMosaicStyle: boolean;
  showMarkerStyle: boolean;
  annotationStyle: AnnotationStyle;
  textStyle: TextStyle;
  counterStyle: CounterStyle;
  mosaicStyle: MosaicStyle;
  markerStyle: MarkerStyle;
  annotationStyleLabel: string;
  onToolChange: (tool: EditorTool) => void;
  onAnnotationStyleChange: (patch: Partial<AnnotationStyle>) => void;
  onTextStyleChange: (patch: Partial<TextStyle>) => void;
  onCounterStyleChange: (patch: Partial<CounterStyle>) => void;
  onMosaicStyleChange: (patch: Partial<MosaicStyle>) => void;
  onMarkerStyleChange: (patch: Partial<MarkerStyle>) => void;
  onAdd: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
};

function ToolbarButton({
  className,
  children,
  disabled,
  onClick,
  label,
}: {
  className: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={[
            "inline-flex size-8 shrink-0 items-center justify-center rounded-md border-2",
            "outline-none transition-[background-color,color,border-color,transform] duration-150",
            "enabled:active:scale-[0.96]",
            "disabled:cursor-not-allowed",
            "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
            className,
          ].join(" ")}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

const disabledButtonClass =
  "disabled:border-[var(--button-disabled)] disabled:bg-[var(--button-disabled)] disabled:text-white";

/**
 * 基本: 背景・枠 = アクセント（4色のみ）/ アイコン = 黒
 * ホバー: 背景 = 黒 / 枠・アイコン = アクセント
 * ※クラス名は静的に書く（Tailwind が拾えるように）
 */
const addButtonClass = [
  "border-[var(--accent-add)] bg-[var(--accent-add)] text-black",
  "hover:enabled:bg-black hover:enabled:border-[var(--accent-add)] hover:enabled:text-[var(--accent-add)]",
  "active:enabled:opacity-90",
  disabledButtonClass,
].join(" ");

const toolsButtonBaseClass = [
  "border-[var(--accent-tools)] bg-[var(--accent-tools)] text-black",
  "hover:enabled:bg-black hover:enabled:border-[var(--accent-tools)] hover:enabled:text-[var(--accent-tools)]",
  "active:enabled:opacity-90",
  disabledButtonClass,
].join(" ");

function toolsButtonClass(active: boolean): string {
  return [toolsButtonBaseClass, active ? "ring-2 ring-black ring-offset-1" : ""].join(" ");
}

const historyButtonClass = [
  "border-[var(--accent-history)] bg-[var(--accent-history)] text-black",
  "hover:enabled:bg-black hover:enabled:border-[var(--accent-history)] hover:enabled:text-[var(--accent-history)]",
  "active:enabled:opacity-90",
  disabledButtonClass,
].join(" ");

const exportButtonClass = [
  "border-[var(--accent-export)] bg-[var(--accent-export)] text-black",
  "hover:enabled:bg-black hover:enabled:border-[var(--accent-export)] hover:enabled:text-[var(--accent-export)]",
  "active:enabled:opacity-90",
  disabledButtonClass,
].join(" ");

const cancelButtonClass = [
  "border-[var(--accent-add)] bg-[var(--accent-add)] text-black",
  "hover:enabled:bg-black hover:enabled:border-[var(--accent-add)] hover:enabled:text-[var(--accent-add)]",
  "active:enabled:opacity-90",
  disabledButtonClass,
].join(" ");

export function Toolbar({
  cropping,
  canExport,
  exporting,
  canUndo,
  canRedo,
  canReset,
  tool,
  showStrokeStyle,
  showTextStyle,
  showCounterStyle,
  showMosaicStyle,
  showMarkerStyle,
  annotationStyle,
  textStyle,
  counterStyle,
  mosaicStyle,
  markerStyle,
  annotationStyleLabel,
  onToolChange,
  onAnnotationStyleChange,
  onTextStyleChange,
  onCounterStyleChange,
  onMosaicStyleChange,
  onMarkerStyleChange,
  onAdd,
  onUndo,
  onRedo,
  onReset,
  onDownload,
  onCopy,
  onApplyCrop,
  onCancelCrop,
}: Props) {
  return (
    <TooltipProvider>
      <div
        className="fixed bottom-6 left-1/2 z-[10001] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 flex-col items-center gap-2"
        onPointerDown={(event) => event.stopPropagation()}
      >
        {showStrokeStyle && !cropping && (
          <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-lg">
            <AnnotationStyleControls
              style={annotationStyle}
              onChange={onAnnotationStyleChange}
              label={annotationStyleLabel}
            />
          </div>
        )}

        {showTextStyle && !cropping && (
          <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-lg">
            <TextStyleControls style={textStyle} onChange={onTextStyleChange} />
          </div>
        )}

        {showCounterStyle && !cropping && (
          <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-lg">
            <CounterStyleControls style={counterStyle} onChange={onCounterStyleChange} />
          </div>
        )}

        {showMosaicStyle && !cropping && (
          <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-lg">
            <MosaicStyleControls style={mosaicStyle} onChange={onMosaicStyleChange} />
          </div>
        )}

        {showMarkerStyle && !cropping && (
          <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-lg">
            <MarkerStyleControls style={markerStyle} onChange={onMarkerStyleChange} />
          </div>
        )}

        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[var(--border)] bg-white px-2.5 py-2 text-foreground shadow-lg">
          {cropping ? (
            <>
            <ToolbarButton className={addButtonClass} label="トリミング適用" onClick={onApplyCrop}>
              <Check />
            </ToolbarButton>
            <ToolbarButton className={cancelButtonClass} label="キャンセル" onClick={onCancelCrop}>
              <X />
            </ToolbarButton>
            </>
          ) : (
            <>
              <ToolbarButton className={addButtonClass} label="画像を追加" onClick={onAdd}>
                <ImagePlus />
              </ToolbarButton>
              <div className="mx-0.5 h-6 w-px shrink-0 bg-[var(--border)]" />
              <ToolbarButton
                className={toolsButtonClass(tool === "arrow")}
                label="矢印"
                onClick={() => onToolChange(tool === "arrow" ? "select" : "arrow")}
              >
                <MoveUpRight />
              </ToolbarButton>
              <ToolbarButton
                className={toolsButtonClass(tool === "rect")}
                label="枠"
                onClick={() => onToolChange(tool === "rect" ? "select" : "rect")}
              >
                <Square />
              </ToolbarButton>
              <ToolbarButton
                className={toolsButtonClass(tool === "text")}
                label="テキスト"
                onClick={() => onToolChange(tool === "text" ? "select" : "text")}
              >
                <Type />
              </ToolbarButton>
              <ToolbarButton
                className={toolsButtonClass(tool === "counter")}
                label="カウンター"
                onClick={() => onToolChange(tool === "counter" ? "select" : "counter")}
              >
                <ListOrdered />
              </ToolbarButton>
              <ToolbarButton
                className={toolsButtonClass(tool === "mosaic")}
                label="モザイク"
                onClick={() => onToolChange(tool === "mosaic" ? "select" : "mosaic")}
              >
                <Grid2x2 />
              </ToolbarButton>
              <ToolbarButton
                className={toolsButtonClass(tool === "marker")}
                label="マーカー"
                onClick={() => onToolChange(tool === "marker" ? "select" : "marker")}
              >
                <Highlighter />
              </ToolbarButton>
              <div className="mx-0.5 h-6 w-px shrink-0 bg-[var(--border)]" />
              <ToolbarButton className={historyButtonClass} label="元に戻す" disabled={!canUndo} onClick={onUndo}>
                <Undo2 />
              </ToolbarButton>
              <ToolbarButton className={historyButtonClass} label="やり直す" disabled={!canRedo} onClick={onRedo}>
                <Redo2 />
              </ToolbarButton>
              <ToolbarButton className={historyButtonClass} label="リセット" disabled={!canReset} onClick={onReset}>
                <RotateCcw />
              </ToolbarButton>
              <div className="mx-0.5 h-6 w-px shrink-0 bg-[var(--border)]" />
              <ToolbarButton
                className={exportButtonClass}
                label="ダウンロード"
                disabled={!canExport || exporting}
                onClick={onDownload}
              >
                <Download />
              </ToolbarButton>
              <ToolbarButton
                className={exportButtonClass}
                label="コピー"
                disabled={!canExport || exporting}
                onClick={onCopy}
              >
                <Copy />
              </ToolbarButton>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
