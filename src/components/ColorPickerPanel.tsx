import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Pipette } from "lucide-react";
import {
  buildChromaticGrid,
  buildGrayscaleRow,
  COLOR_GRID_COLS,
  COLOR_GRID_ROWS,
  hexToHsl,
  hslToHex,
  toHexColor,
} from "@/lib/color";
import { cn } from "@/lib/utils";

/** カラーピッカーの表示タブ種別。 */
type Tab = "grid" | "spectrum";

/** カラーピッカーパネルのプロパティ。 */
type Props = {
  value: string;
  onChange: (color: string) => void;
  /** キャンバスから色を拾う（指定時のみスポイト表示） */
  onEyedropper?: () => void;
};

/** グリッド／スペクトル切替タブの定義。 */
const TABS: { id: Tab; label: string }[] = [
  { id: "grid", label: "グリッド" },
  { id: "spectrum", label: "スペクトル" },
];

/** タブ切り替えでポップアップサイズが変わらないよう固定 */
const PANEL_BODY_HEIGHT = 176;

/** グレースケール色の1行分パレット。 */
const GRAYSCALE = buildGrayscaleRow();
/** 色相グリッドのパレット。 */
const CHROMATIC = buildChromaticGrid();

/**
 * macOS 風のカラーピッカー本体（グリッド・スペクトル・HEX）。
 * @param props 現在色と変更コールバック
 * @returns {JSX.Element} ピッカーパネル
 */
export function ColorPickerPanel({ value, onChange, onEyedropper }: Props) {
  const [tab, setTab] = useState<Tab>("grid");
  const hex = toHexColor(value);

  return (
    <div
      className="w-[260px] rounded-xl border border-black/10 bg-white p-3 shadow-xl"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className="mb-3 grid grid-cols-2 rounded-lg bg-[#ececec] p-0.5 text-[11px] font-medium text-[#3a3a3a]"
        role="tablist"
        aria-label="カラーピッカーの表示"
      >
        {TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                "rounded-md px-1 py-1.5 transition-[background-color,box-shadow,color]",
                selected
                  ? "bg-white text-black shadow-sm"
                  : "text-[#5c5c5c] hover:text-black",
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div style={{ height: PANEL_BODY_HEIGHT }}>
        {tab === "grid" ? (
          <GridView value={hex} onChange={onChange} />
        ) : (
          <SpectrumView value={hex} onChange={onChange} />
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-black/8 pt-2">
        {onEyedropper ? (
          <button
            type="button"
            title="画像や注釈から色を取得"
            aria-label="スポイトで色を取得"
            className="flex size-7 shrink-0 items-center justify-center rounded-md border border-black/10 bg-[#f7f7f7] text-[#333] transition-colors hover:border-black/25 hover:bg-white"
            onClick={onEyedropper}
          >
            <Pipette className="size-3.5" strokeWidth={2} />
          </button>
        ) : null}
        <span
          className="size-7 shrink-0 rounded-md border border-black/10 shadow-sm"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
        <HexField value={hex} onChange={onChange} />
      </div>
    </div>
  );
}

/**
 * グリッドタブの色見本一覧。
 * @param props 現在色と選択コールバック
 * @returns {JSX.Element} グリッド UI
 */
function GridView({ value, onChange }: Props) {
  const current = value.toLowerCase();

  return (
    <div className="flex h-full flex-col gap-1" role="listbox" aria-label="色グリッド">
      <div
        className="grid h-7 shrink-0 overflow-hidden rounded-md"
        style={{ gridTemplateColumns: `repeat(${COLOR_GRID_COLS}, minmax(0, 1fr))` }}
      >
        {GRAYSCALE.map((color) => (
          <Swatch
            key={`g-${color}`}
            color={color}
            selected={current === color.toLowerCase()}
            onSelect={onChange}
          />
        ))}
      </div>
      <div
        className="grid min-h-0 flex-1 overflow-hidden rounded-md"
        style={{
          gridTemplateColumns: `repeat(${COLOR_GRID_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${COLOR_GRID_ROWS}, minmax(0, 1fr))`,
        }}
      >
        {CHROMATIC.map((row, rowIndex) =>
          row.map((color, colIndex) => (
            <Swatch
              key={`${rowIndex}-${colIndex}-${color}`}
              color={color}
              selected={current === color.toLowerCase()}
              onSelect={onChange}
            />
          )),
        )}
      </div>
    </div>
  );
}

/**
 * グリッド内の1色スウォッチボタン。
 * @param props 色・選択状態・選択時コールバック
 * @returns {JSX.Element} スウォッチ
 */
function Swatch({
  color,
  selected,
  onSelect,
}: {
  color: string;
  selected: boolean;
  onSelect: (color: string) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      title={color}
      aria-label={color}
      className={cn(
        "h-full w-full outline-none transition-transform",
        selected && "relative z-10 scale-110 ring-2 ring-white ring-offset-1 ring-offset-black/40",
      )}
      style={{ backgroundColor: color }}
      onClick={() => onSelect(color)}
    />
  );
}

/**
 * スペクトルタブの連続色相ピッカー。
 * @param props 現在色と変更コールバック
 * @returns {JSX.Element} スペクトル UI
 */
function SpectrumView({ value, onChange }: Props) {
  const hsl = hexToHsl(value);
  const areaRef = useRef<HTMLDivElement>(null);

  const pickFromPoint = (clientX: number, clientY: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const l = 94 - y * 78;
    const s = y < 0.15 ? (y / 0.15) * 70 : 70 + Math.min(1, (y - 0.15) / 0.85) * 30;
    onChange(hslToHex({ h: x * 360, s, l }));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pickFromPoint(event.clientX, event.clientY);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    pickFromPoint(event.clientX, event.clientY);
  };

  const markerX = (hsl.h / 360) * 100;
  const markerY = Math.max(0, Math.min(100, ((94 - hsl.l) / 78) * 100));

  return (
    <div
      ref={areaRef}
      role="slider"
      aria-label="スペクトル"
      aria-valuetext={value}
      tabIndex={0}
      className="relative h-full cursor-crosshair touch-none overflow-hidden rounded-md"
      style={{
        background: `
          linear-gradient(to bottom, #ffffff 0%, transparent 45%, rgba(0,0,0,0.55) 100%),
          linear-gradient(
            to right,
            hsl(0 100% 50%),
            hsl(60 100% 50%),
            hsl(120 100% 45%),
            hsl(180 100% 45%),
            hsl(240 100% 55%),
            hsl(300 100% 50%),
            hsl(360 100% 50%)
          )
        `,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
        style={{ left: `${markerX}%`, top: `${markerY}%`, backgroundColor: value }}
      />
    </div>
  );
}

/**
 * HEX 文字列を直接編集する入力欄。
 * @param props 現在の HEX と確定時コールバック
 * @returns {JSX.Element} HEX 入力
 */
function HexField({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [draft, setDraft] = useState(value.toUpperCase());

  useEffect(() => {
    setDraft(value.toUpperCase());
  }, [value]);

  return (
    <input
      type="text"
      spellCheck={false}
      value={draft}
      aria-label="HEX カラー"
      className="h-7 min-w-0 flex-1 rounded-md border border-black/10 bg-[#f7f7f7] px-2 font-mono text-[12px] uppercase outline-none focus:border-black/30"
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        const trimmed = next.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(trimmed) || /^#[0-9a-fA-F]{3}$/.test(trimmed)) {
          onChange(toHexColor(trimmed));
        }
      }}
      onBlur={() => setDraft(value.toUpperCase())}
    />
  );
}
