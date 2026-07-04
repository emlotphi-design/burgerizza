/**
 * Module-level image cache — outside any component, so entries survive
 * re-renders/unmounts and are never garbage-collected. preloadImages() is
 * idempotent: calling it again with URLs already in the cache is a no-op,
 * which is what makes this "fetch once, never again" rather than a
 * one-shot prefetch.
 */
const cache = new Map();

export function preloadImages(urls) {
  for (const url of urls) {
    if (!url || cache.has(url)) continue;
    const img = new Image();
    img.src = url;
    cache.set(url, img);
  }
}

export function isImageCached(url) {
  return cache.has(url);
}

export const imageCache = cache;
