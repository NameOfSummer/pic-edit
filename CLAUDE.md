# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code (claude.ai/code) 向けのガイドです。

pic-edit はブラウザだけで動く画像注釈アプリ（Shottr 風）です。透明な市松模様のキャンバスに画像を置き、矢印・矩形・テキスト・番号カウンター・モザイク・蛍光ペンで注釈を付けて、透過 PNG として書き出します。構成は Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui (Radix)。GitHub Pages にデプロイしています（`vite.config.ts` の `base: "/pic-edit/"`）。機能とコーディング規約の正は README.md（日本語）です。

## コマンド

```bash
npm install
npm run rebuild:esbuild   # install 後に必須: .npmrc が ignore-scripts=true のため、これを実行しないと esbuild のバイナリがセットアップされない
npm run dev
npm run lint              # ESLint（必須の JSDoc ルールを含む）
npm run typecheck         # tsc --noEmit
npm run build             # typecheck + vite build（CI では lint と npm audit の後にこれを実行）
```

テストスイートはありません。変更は `npm run lint` と `npm run build` で確認します。

## アーキテクチャ

- **エディタは DOM で描画し、canvas を使うのは書き出し時だけ。** 画像と注釈は位置指定した DOM/SVG 要素として描画します（`components/*View.tsx`、`LayerImage.tsx`）。`src/editor/export.ts` は `*Geometry.ts` の描画関数を使って、`Editor.tsx` の DOM と同じ重なり順（下 → 上）ですべてを `<canvas>` に描き直します。View の見た目を変えたら geometry / export 側の描画にも必ず同じ変更を入れること。入れないと PNG が画面表示と食い違います。
- **`Editor.tsx` が全体の司令塔**（約 2000 行）: ツール切替（`types.ts` の `EditorTool`）、ポインター処理、キーボードショートカット、クリップボード、トリミング、スポイト、コンテキストメニュー、書き出し。注釈の種類ごとの state はそれぞれ専用の hook（`src/editor/use*.ts`）にあり、add / update / remove を公開しています。画像レイヤーは `useLayers` が扱います。
- **Undo/redo はスナップショット方式。** `history.ts` は `EditorSnapshot`（全レイヤーと全注釈の配列）を丸ごと保存します。`Editor.tsx` は最新の state を写した `docRef` を保持しているので、`takeSnapshot()` は常に最新の状態を返します。単発の変更の前には `pushHistory()` を呼び、ドラッグでは `beginGesture()` を使います（`gestureRef` で制御され、1 ジェスチャーにつき 1 回だけ push される）。
- **更新はパッチで渡す。** hook はオブジェクト全体ではなく `*Patch` 型（変更したフィールドだけ）を受け取ります。ドラッグ中はビューポートの `clientX` / `clientY` をそのまま使い、確定する値は `Math.round` で丸めます。
- **スポイト**は `EyedropperContext`（`useEyedropper()`）経由でスタイル設定 UI に提供されます。実装は `Editor.tsx` と `eyedropper.ts` です。

### 注釈の種類を追加するとき

次のすべてに手を入れます（README の「注釈を足すとき」を参照）:
`types.ts`（注釈の型、`*Patch`、`DEFAULT_*`）、`use*.ts` hook（id は `crypto.randomUUID()` で生成）、`*Geometry.ts`（座標計算と canvas 描画。React コンポーネント内には書かない）、`*View.tsx`、`*SelectionChrome.tsx`、`*StyleControls.tsx`、さらに `history.ts`（`EditorSnapshot` / `cloneSnapshot`）、`export.ts`、`annotationClipboard.ts`、`Editor.tsx` / `Toolbar.tsx` のツール切替。

## 規約（lint / tsc でチェックされる）

- named export のみ使い、`export default` は使わない（設定ファイルは例外）。コンポーネントは `export function Name()` の形で書き、Props はファイル内の `type Props` で定義する。1 ファイルにつき 1 コンポーネントとし、ファイル名は export 名と同じにする。
- ディレクトリをまたぐ import は `@/`、同じディレクトリ内の import は `./` を使う。型だけの import は `import type` / `import { type ... }` を使う。未使用の変数・引数には `_` を付ける。
- Tailwind のクラスは静的な文字列で書き、条件付きの結合は `cn()`（`@/lib/utils`）で行う。
- `src/components/ui/` は shadcn/ui の生成コードなので、アプリの規約に合わせて書き換えない。
- すべての `function` 宣言と、トップレベルのすべての `const` / `var` / `type` に**日本語の JSDoc が必須**。説明文、引数ごとの `@param`、`@returns {Type}`（`@returns {void}` も含む）を書く。引数なしの関数には `@param` を書かない。定数・型、`map` / `sort` に渡すコールバックにも書かない。分割代入で props を受け取る関数は `@param props` として書く。
- コメントとコミットメッセージは日本語で書く。コミットの 1 行目には変更の理由を書く。

## 依存関係

- `.npmrc` の `min-release-age=7` と `ignore-scripts=true` は外さない（サプライチェーン攻撃対策）。
- `tsc` は `@typescript/native` 経由の TypeScript 7。typescript-eslint はまだ TS 7 のコンパイラ API を import できないため、`typescript` というパッケージ名を `@typescript/typescript6` のエイリアスにしている。このエイリアスは「修正」しないこと。
