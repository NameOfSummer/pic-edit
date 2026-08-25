import { createContext, useContext } from "react";

export type EyedropperApi = {
  /** キャンバス（画像・注釈）から色を拾うモードを開始する */
  startEyedropper: (onPick: (color: string) => void) => void;
};

export const EyedropperContext = createContext<EyedropperApi | null>(null);

export function useEyedropper(): EyedropperApi | null {
  return useContext(EyedropperContext);
}
