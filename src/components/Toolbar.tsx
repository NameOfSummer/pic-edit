import { useEffect, useState, type ReactNode } from "react";
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

/** ツールバー全体のプロパティ。 */
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

/**
 * ツールチップ付きのツールバー用アイコンボタン（凸型、選択中は凹型）。
 * @param props 選択状態・無効状態・クリックとラベル
 * @returns {JSX.Element} ツールバーボタン
 */
function ToolbarButton({
  pressed,
  children,
  disabled,
  onClick,
  label,
}: {
  pressed?: boolean;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  const tooltipSide = useLandscape() ? "left" : "top";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={pressed}
          disabled={disabled}
          onClick={onClick}
          className="neu-button inline-flex size-8.5 shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:size-[17px] [&_svg]:shrink-0"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * 横長ウィンドウかどうか。ツールバーを右の縦並びに切り替える。
 * @returns {boolean} 横幅が縦より長いとき true
 */
function useLandscape(): boolean {
  const query = "(orientation: landscape)";
  const [landscape, setLandscape] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setLandscape(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return landscape;
}

/** スタイルパネル（ツールごとの色・太さなど）の外枠クラス。 */
const stylePanelClass = "neu-panel px-3 py-2.5";

/** ツールバーの区切り線クラス。 */
const dividerClass = "neu-divider mx-1 h-6 w-px landscape:mx-0 landscape:my-1 landscape:h-px landscape:w-6";

/**
 * エディタ上部のツールバー。ツール切替・スタイル・履歴・書き出しをまとめる。
 * @param props ツール状態と各種操作コールバック
 * @returns {JSX.Element} ツールバー UI
 */
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
        className="fixed z-[10001] overscroll-contain portrait:bottom-2 portrait:left-1/2 portrait:w-[calc(100vw-1rem)] portrait:max-w-max portrait:-translate-x-1/2 portrait:overflow-x-auto portrait:overflow-y-hidden landscape:top-1/2 landscape:right-2 landscape:h-[calc(100vh-1rem)] landscape:max-h-max landscape:-translate-y-1/2 landscape:overflow-x-hidden landscape:overflow-y-auto"
        onPointerDown={(event) => event.stopPropagation()}
      >
      <div className="flex w-max flex-col items-center gap-3.5 p-4 landscape:flex-row landscape:items-start">
        {showStrokeStyle && !cropping && (
          <div className={stylePanelClass}>
            <AnnotationStyleControls
              style={annotationStyle}
              onChange={onAnnotationStyleChange}
              label={annotationStyleLabel}
            />
          </div>
        )}

        {showTextStyle && !cropping && (
          <div className={stylePanelClass}>
            <TextStyleControls style={textStyle} onChange={onTextStyleChange} />
          </div>
        )}

        {showCounterStyle && !cropping && (
          <div className={stylePanelClass}>
            <CounterStyleControls style={counterStyle} onChange={onCounterStyleChange} />
          </div>
        )}

        {showMosaicStyle && !cropping && (
          <div className={stylePanelClass}>
            <MosaicStyleControls style={mosaicStyle} onChange={onMosaicStyleChange} />
          </div>
        )}

        {showMarkerStyle && !cropping && (
          <div className={stylePanelClass}>
            <MarkerStyleControls style={markerStyle} onChange={onMarkerStyleChange} />
          </div>
        )}

        <div className="neu-panel flex w-max shrink-0 items-center gap-1.5 p-2.5 text-foreground landscape:flex-col-reverse">
          {cropping ? (
            <>
            <ToolbarButton label="トリミング適用" onClick={onApplyCrop}>
              <Check />
            </ToolbarButton>
            <ToolbarButton label="キャンセル" onClick={onCancelCrop}>
              <X />
            </ToolbarButton>
            </>
          ) : (
            <>
              <ToolbarButton label="画像を追加" onClick={onAdd}>
                <ImagePlus />
              </ToolbarButton>
              <div className={dividerClass} />
              <ToolbarButton
                pressed={tool === "arrow"}
                label="矢印"
                onClick={() => onToolChange(tool === "arrow" ? "select" : "arrow")}
              >
                <MoveUpRight />
              </ToolbarButton>
              <ToolbarButton
                pressed={tool === "rect"}
                label="枠"
                onClick={() => onToolChange(tool === "rect" ? "select" : "rect")}
              >
                <Square />
              </ToolbarButton>
              <ToolbarButton
                pressed={tool === "text"}
                label="テキスト"
                onClick={() => onToolChange(tool === "text" ? "select" : "text")}
              >
                <Type />
              </ToolbarButton>
              <ToolbarButton
                pressed={tool === "counter"}
                label="カウンター"
                onClick={() => onToolChange(tool === "counter" ? "select" : "counter")}
              >
                <ListOrdered />
              </ToolbarButton>
              <ToolbarButton
                pressed={tool === "mosaic"}
                label="モザイク"
                onClick={() => onToolChange(tool === "mosaic" ? "select" : "mosaic")}
              >
                <Grid2x2 />
              </ToolbarButton>
              <ToolbarButton
                pressed={tool === "marker"}
                label="マーカー"
                onClick={() => onToolChange(tool === "marker" ? "select" : "marker")}
              >
                <Highlighter />
              </ToolbarButton>
              <div className={dividerClass} />
              <ToolbarButton label="元に戻す" disabled={!canUndo} onClick={onUndo}>
                <Undo2 />
              </ToolbarButton>
              <ToolbarButton label="やり直す" disabled={!canRedo} onClick={onRedo}>
                <Redo2 />
              </ToolbarButton>
              <ToolbarButton label="リセット" disabled={!canReset} onClick={onReset}>
                <RotateCcw />
              </ToolbarButton>
              <div className={dividerClass} />
              <ToolbarButton
               
                label="ダウンロード"
                disabled={!canExport || exporting}
                onClick={onDownload}
              >
                <Download />
              </ToolbarButton>
              <ToolbarButton
               
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
      </div>
    </TooltipProvider>
  );
}
