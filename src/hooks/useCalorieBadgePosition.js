import { useLayoutEffect, useRef } from 'react';

/**
 * Positions the floating premium calorie badge just off the product's
 * upper-right shoulder — close enough to read as attached to it rather
 * than orphaned in empty space — while staying fully outside the product
 * canvas (never over it or any ingredient preview, all of which live
 * inside the canvas's own bounds) and clear of the "Your Pizza/Burgers"
 * panel once one exists. Falls back to centered-above-canvas whenever
 * there isn't genuinely enough width for the diagonal position (narrow
 * desktop, tablet, mobile), rather than guessing a fixed breakpoint.
 *
 * Shared by Pizza Builder and Burger Builder so both get identical
 * behavior from one implementation instead of two hand-kept copies.
 * Reads the DOM directly (no ref threaded through the canvas component),
 * so it never touches — and therefore never moves — the product itself.
 *
 * @param {boolean} active - whether the badge is currently shown (e.g. a
 *   dough / bun has been selected). Skips all work when false.
 * @param {string} canvasSelector - CSS selector for the product's own
 *   canvas element (e.g. '.pizza-canvas-wrap', '.bb-builder-canvas').
 * @param {Array} extraDeps - additional dependency values that should
 *   trigger a reposition when they change (e.g. counts that mount/unmount
 *   sibling elements affecting available space). Must be the same length
 *   on every render at a given call site.
 */
export function useCalorieBadgePosition(active, canvasSelector, extraDeps = []) {
  const badgeWrapRef = useRef(null);

  useLayoutEffect(() => {
    if (!active) return undefined;
    const wrap = badgeWrapRef.current;
    const canvasEl = document.querySelector(canvasSelector);
    if (!wrap || !canvasEl) return undefined;

    function reposition() {
      const canvasRect = canvasEl.getBoundingClientRect();
      const badgeWidth  = wrap.offsetWidth  || 140;
      const badgeHeight = wrap.offsetHeight || 50;
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 74;
      const minTop = navH + 12;
      const gap = 32;
      const margin = 20;

      const panelEl = document.querySelector('.bpc-panel');
      const rightLimit = panelEl
        ? panelEl.getBoundingClientRect().left - margin
        : window.innerWidth - margin;

      const fitsDiagonally = (rightLimit - canvasRect.right) >= (gap + badgeWidth);

      let top, left;
      if (fitsDiagonally) {
        // Upper-right shoulder of the product: vertically inside the
        // canvas's top ~20%, which is otherwise empty on both builders'
        // orbital layouts, so it visually reads as attached without any
        // risk of overlapping ingredient previews since the badge itself
        // is entirely outside the canvas's horizontal span.
        left = canvasRect.right + gap;
        top = canvasRect.top + canvasRect.height * 0.20 - badgeHeight / 2;
        top = Math.max(top, minTop);
      } else {
        const isNarrow = window.innerWidth <= 480;
        const desiredGap = isNarrow ? 24 : 40;
        top = canvasRect.top - desiredGap - badgeHeight;
        top = Math.max(top, minTop);
        // Never overlap the product itself, even if that means dipping
        // below minTop in a window too short to fit both at once.
        if (top + badgeHeight > canvasRect.top) {
          top = canvasRect.top - badgeHeight;
        }
        left = canvasRect.left + canvasRect.width / 2 - badgeWidth / 2;
      }

      wrap.style.top = `${top}px`;
      wrap.style.left = `${left}px`;
    }

    reposition();
    // ResizeObserver only fires on size changes, not pure position drift —
    // something in the first ~1s after mount (web font swap, async image
    // loads elsewhere on the page, etc.) can still nudge the canvas's Y
    // position by a few px without changing its size. A short bounded
    // series of re-checks catches that settle regardless of its exact
    // cause, without needing a permanent polling loop.
    const settleTimers = [50, 150, 300, 600, 1000, 1500].map(delay => setTimeout(reposition, delay));
    window.addEventListener('resize', reposition);
    const ro = new ResizeObserver(reposition);
    ro.observe(canvasEl);

    return () => {
      settleTimers.forEach(clearTimeout);
      window.removeEventListener('resize', reposition);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, canvasSelector, ...extraDeps]);

  return badgeWrapRef;
}
