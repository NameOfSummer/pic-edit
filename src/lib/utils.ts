import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind のクラス名を条件付きで結合し、衝突を解決する。
 * @param inputs クラス名、配列、または falsy
 * @returns {string} 結合後のクラス名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
