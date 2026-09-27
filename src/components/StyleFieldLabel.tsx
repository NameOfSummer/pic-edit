import type { ReactNode } from "react";

/**
 * ツールバー内の色・スタイル行向けの小さな見出し。
 * @param props 見出しの文言
 * @returns {JSX.Element} 見出し
 */
export function StyleFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 text-[10px] leading-none font-medium tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}
