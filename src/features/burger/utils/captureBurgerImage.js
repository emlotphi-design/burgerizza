/**
 * captureBurgerImage.js
 *
 * Composites bun base + ingredient layers + bun top onto a 240×240 offscreen
 * canvas and returns a PNG data-URL. Returns null on failure — callers should
 * fall back to the bun preview image.
 *
 * All image maps are sourced from burgerImages.js (single source of truth).
 */

import {
  BUN_BASES, BUN_TOPS, BUN_BASE_WIDTH,
  MEAT_BASES, CHEESE_BASES, SAUCE_BASES, VEGETABLE_BASES,
} from './burgerImages';

/**
 * @param  {object} snapshot  Burger draft: { bun, selectionOrder }
 * @returns {Promise<string|null>}  PNG data-URL, or null if capture fails.
 */
export async function captureBurgerImage(snapshot) {
  if (!snapshot?.bun) return null;

  const SIZE = 240;
  const canvas = document.createElement('canvas');
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const loadImg = src => new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const drawCentered = async (src, drawSize, rotateDeg = 0) => {
    if (!src) return;
    const img = await loadImg(src);
    if (!img) return;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    ctx.save();
    ctx.translate(cx, cy);
    if (rotateDeg) ctx.rotate(rotateDeg * Math.PI / 180);
    ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
  };

  const ingSize      = SIZE * 0.36;
  const bunWidthPct  = BUN_BASE_WIDTH[snapshot.bun] ?? 36;
  const bunSize      = SIZE * (bunWidthPct / 100);

  await drawCentered(BUN_BASES[snapshot.bun], bunSize, -2);

  for (const { type, id } of (snapshot.selectionOrder ?? [])) {
    if      (type === 'sauce'     && SAUCE_BASES[id])     await drawCentered(SAUCE_BASES[id],     ingSize);
    else if (type === 'meat'      && MEAT_BASES[id])      await drawCentered(MEAT_BASES[id],      ingSize);
    else if (type === 'cheese'    && CHEESE_BASES[id])    await drawCentered(CHEESE_BASES[id],    ingSize);
    else if (type === 'vegetable' && VEGETABLE_BASES[id]) await drawCentered(VEGETABLE_BASES[id], ingSize);
  }

  await drawCentered(BUN_TOPS[snapshot.bun], bunSize, -2);

  try {
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
