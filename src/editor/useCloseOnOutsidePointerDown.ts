import { useEffect, type RefObject } from "react";

/**
 * 開いているポップオーバーを、外側の pointerdown で閉じる。
 * ツールバーの stopPropagation で Radix の外側判定が狂う（中を操作した直後の外側クリックで閉じない）ため、
 * document の capture で自前で検知する。入れ子のカラーピッカーなどポップオーバーの中は外側として扱わない。
 * @param open 開いているとき true
 * @param triggerRef 開閉ボタン。押すと閉じてすぐ開き直さないよう外側として扱わない
 * @param onClose 閉じる処理
 * @returns {void}
 */
export function useCloseOnOutsidePointerDown(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  useEffect(() => {
    if (!open) {
      return;
    }

    /**
     * 押された場所がポップオーバーと開閉ボタンの外なら閉じる。
     * @param event pointerdown イベント
     * @returns {void}
     */
    function onPointerDown(event: globalThis.PointerEvent): void {
      const { target } = event;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.closest("[data-radix-popper-content-wrapper]") || triggerRef.current?.contains(target)) {
        return;
      }
      onClose();
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, triggerRef, onClose]);
}
