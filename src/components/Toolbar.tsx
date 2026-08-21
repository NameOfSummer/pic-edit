type Props = {
  canDelete: boolean;
  onAdd: () => void;
  onDelete: () => void;
};

export function Toolbar({ canDelete, onAdd, onDelete }: Props) {
  return (
    <div className="toolbar" onPointerDown={(event) => event.stopPropagation()}>
      <button type="button" className="tool-button" onClick={onAdd}>
        画像を追加
      </button>
      <button type="button" className="tool-button" onClick={onDelete} disabled={!canDelete}>
        削除
      </button>
      <span className="toolbar-hint">Delete で選択中を削除</span>
    </div>
  );
}
