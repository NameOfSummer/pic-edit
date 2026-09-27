# pic-edit

ブラウザで動く画像注釈アプリです。Shottr のように透過の市松背景に画像を置き、矢印・枠・テキスト・カウンター・モザイク・マーカーなどで注釈を付けて、透過 PNG として書き出せます。

UI は **Vite + React + TypeScript**、**Tailwind CSS**、**shadcn/ui** で構成しています。

## できること

### 画像

- 市松背景（白 / `#FFF2D9`）で透過を確認
- ドラッグ＆ドロップ、クリップボード貼り付け（`⌘V` / `Ctrl+V`）、ツールバーから画像追加
- 移動・角ハンドルでのリサイズ・回転（Shift で 15° 刻み）
- 右クリック: 貼り付け・トリミング・削除・最前面 / 前面 / 背面 / 最背面
- トリミング（範囲指定 → ツールバーで適用 / キャンセル）
- Delete / Backspace で削除

### 注釈

| ツール | 操作の概要 |
| --- | --- |
| 矢印 | ドラッグで描画。端点調整、色・太さ |
| 枠 | ドラッグで描画。移動・回転・リサイズ、色・太さ |
| テキスト | クリックで配置。フォントはメイリオ。サイズ・標準/太字・色。移動・回転。ダブルクリックで編集 |
| カウンター | クリックで連番マーカー。色・サイズ。同番号のコピペ可。削除時は大きい番号を繰り下げ |
| モザイク | ドラッグで範囲指定。粗さ変更、移動・回転・リサイズ |
| マーカー | 蛍光ペン風（ピンク / 水色 / 緑 / 黄）。太さ指定。線は直線に補正（Shift または 45° 近傍で角度スナップ）。移動・回転 |

注釈の色（マーカー以外）は虹色 7 色（赤・橙・黄・緑・青・藍・紫）。デフォルトは緑 `#32CD32`。

### 編集全般

- 注釈のコピペ（`⌘C` / `⌘V`）。連続ペーストで少しずつずれて複製
- Undo / Redo（`⌘Z` / `⌘⇧Z` または `⌘Y`）
- リセット（キャンバスを空にし、履歴もクリア）
- 書き出し: 透過 PNG のダウンロード / クリップボードコピー（外接矩形 + 余白 12px、元解像度相当）

## 起動

```bash
npm install
npm run dev
```

ブラウザで表示された URL を開いてください。

```bash
npm run build    # 本番ビルド
npm run preview  # ビルド結果の確認
```

## 主な操作

| 操作 | 内容 |
| --- | --- |
| `⌘V` / `Ctrl+V` | 画像の貼り付け（なければ注釈の貼り付け） |
| `⌘C` / `Ctrl+C` | 選択中注釈のコピー |
| `⌘Z` | Undo |
| `⌘⇧Z` / `⌘Y` | Redo |
| Delete / Backspace | 選択中の画像または注釈を削除 |
| Escape | ツール解除 / 選択解除 / 編集終了 |
| Shift（回転・マーカー） | 角度スナップ |

## 技術スタック

- Vite 7 / React 19 / TypeScript
- Tailwind CSS v4
- shadcn/ui（Radix）
- lucide-react

## コーディング規約

現状のソースに合わせた書き方です。

### ディレクトリ

| 場所 | 置くもの |
| --- | --- |
| `src/components/` | 画面部品。1 ファイル 1 コンポーネントで、ファイル名と export 名を揃える（`ArrowView.tsx`） |
| `src/components/ui/` | shadcn/ui の生成物。アプリ側の書き方に合わせ直さない |
| `src/editor/` | 注釈の型、状態フック、幾何、書き出し、履歴、クリップボード |
| `src/lib/` | UI に依存しない小さな関数（`cn`、色） |
| `src/assets/` | フォントなどの静的ファイル |

画面の組み立ては `Editor.tsx` に置く。注釈ごとの状態は `useArrows` のように `src/editor/use*.ts` に分ける。

### 注釈を足すとき

種類ごとに次を揃える。

- 型・初期値・選択肢は `src/editor/types.ts`（`ArrowAnnotation`、`ArrowPatch`、`DEFAULT_*`）
- 追加・更新・削除は `use*` フック。新規 id は `crypto.randomUUID()`
- 座標計算とキャンバス描画は `*Geometry.ts` の関数にする。React コンポーネントには置かない
- 画面上の本体は `*View.tsx`、選択枠は `*SelectionChrome.tsx`、ツールバーの設定は `*StyleControls.tsx`
- 履歴（`history.ts`）、書き出し（`export.ts`）、コピー（`annotationClipboard.ts`）、`Editor.tsx` のツール切り替えにも同じ種類を足す

ドラッグ中の座標はビューポートの `clientX` / `clientY` をそのまま使い、確定値は `Math.round` する。更新はオブジェクト全体の差し替えではなく `Patch`（変更したフィールドだけ）で渡す。

### TypeScript / React

- named export のみ。`export default` は使わない
- コンポーネントは `export function 名前()`。props の型はファイル内の `type Props`
- ディレクトリをまたぐ import は `@/`（`@/editor/types`）。同じディレクトリ内は `./`
- 型だけの import は `import type` か `import { type ... }`
- 未使用の引数・変数は `_` で始める
- Tailwind のクラスは静的な文字列にする。条件付きの結合は `cn()` を使う

`strict`、未使用のローカルと引数の禁止、`npm run lint` に合わせる。チェックは `npm run lint` と `npm run typecheck`（`npm run build` も型チェックを含む）。

### JSDoc

`function` で宣言した関数には JSDoc を付ける。ファイルの直下にある `const` と `type` にも、何の定数・型かを説明する JSDoc を付ける。関数の中で作る定数は対象にしない。GAS は `const` を使わないので、ファイルの直下にある `var` の定数に同じ説明を付ける。説明は日本語にする。`npm run lint` は、次が欠けているとエラーにする。

- 関数、定数、型の説明文
- 関数で引数があるとき、引数ごとの `@param`
- 関数の `@returns`。戻り値がない関数も `@returns {void}` と書く

引数がない関数に `@param` は書かない。定数と型には `@param` と `@returns` を書かない。`sort` や `map` に渡す無名関数には付けない。引数をその場で分割代入している関数は、lint 上の引数名が `props` になる。

### 依存関係

- `.npmrc` の `min-release-age=7` と `ignore-scripts=true` を崩さない
- `tsc` は TypeScript 7（`@typescript/native`）。`typescript` パッケージ名は ESLint 用の 6 系互換（`@typescript/typescript6`）のままにする。`typescript-eslint` は TypeScript 7 のコンパイラ API をまだ import できない
- コミットメッセージは日本語。1 行目に変更の理由を書く
