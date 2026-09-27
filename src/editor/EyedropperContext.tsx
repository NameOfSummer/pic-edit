import { createContext, useContext } from "react";

/** スポイト開始を子コンポーネントへ渡す API。 */
export type EyedropperApi = {
  /** キャンバス（画像・注釈）から色を拾うモードを開始する */
  startEyedropper: (onPick: (color: string) => void) => void;
};

/** スポイト API の React context。未設定なら null。 */
export const EyedropperContext = createContext<EyedropperApi | null>(null);

/**
 * スポイト API を読む。Provider の外では null。
 * @returns {EyedropperApi | null} スポイト API
 */
export function useEyedropper(): EyedropperApi | null {
  return useContext(EyedropperContext);
}
