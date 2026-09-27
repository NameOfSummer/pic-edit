import { rgbToHex } from "@/lib/color";
import { renderSceneToCanvas, type Bounds, type SceneDocument } from "@/editor/export";

/** この値未満のアルファは透明として色を返さない。 */
const MIN_ALPHA = 16;

/** 合成済みキャンバスから色を読むスポイト。 */
export type SceneColorSampler = {
  bounds: Bounds;
  /** 画面座標（clientX/Y）の色。透明なら null */
  sample: (clientX: number, clientY: number) => string | null;
};

/**
 * 画面座標で 1:1 合成し、クリック位置の色を返すスポイトを作る。
 * @param doc 画像と注釈
 * @returns {Promise<SceneColorSampler | null>} シーンが空なら null
 */
export async function createSceneColorSampler(
  doc: SceneDocument,
): Promise<SceneColorSampler | null> {
  const rendered = await renderSceneToCanvas(doc, { scale: 1, padding: 0 });
  if (!rendered) {
    return null;
  }

  const { canvas, bounds } = rendered;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas を初期化できませんでした");
  }

  return {
    bounds,
    sample(clientX, clientY) {
      const px = Math.floor(clientX - bounds.minX);
      const py = Math.floor(clientY - bounds.minY);
      if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) {
        return null;
      }
      const data = ctx.getImageData(px, py, 1, 1).data;
      if (data[3]! < MIN_ALPHA) {
        return null;
      }
      return rgbToHex({ r: data[0]!, g: data[1]!, b: data[2]! });
    },
  };
}
