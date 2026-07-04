import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly tweens a displayed number toward `value` whenever it changes,
 * using requestAnimationFrame with an ease-out curve. Used by NutritionBadge
 * so every calorie display animates for free instead of jumping.
 */
export function useAnimatedNumber(value, duration = 400) {
  const [display, setDisplay] = useState(value ?? 0);
  const frameRef = useRef(null);
  const fromRef  = useRef(value ?? 0);

  useEffect(() => {
    const target = value ?? 0;
    const from   = fromRef.current;
    if (from === target) { setDisplay(target); return; }

    const start = performance.now();
    cancelAnimationFrame(frameRef.current);

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (target - from) * eased;
      setDisplay(current);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return display;
}
