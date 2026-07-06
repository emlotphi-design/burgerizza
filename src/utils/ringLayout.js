/**
 * Generic circular-layout helpers for slotting newly-added (admin-created)
 * ingredients into the existing topping "rings" used by PizzaCanvas.jsx and
 * BurgerBuilder.jsx — e.g. the meat ring (9 hand-placed items, 37% radius)
 * or the burger sauce ring (5 items, 42% radius).
 *
 * Every existing position in this codebase already follows the same formula:
 *   top  = 50 - radius * cos(angle)
 *   left = 50 + radius * sin(angle)
 * where angle is degrees clockwise from 12 o'clock (0deg = top-center).
 * angleFromPos() inverts that to recover an existing item's angle; new items
 * are placed at the midpoint of the largest remaining angular gap so
 * existing hand-placed items never move when one is added.
 */

export function angleFromPos(pos) {
  const top = parseFloat(pos.top);
  const left = parseFloat(pos.left);
  const rad = Math.atan2(left - 50, -(top - 50));
  return (rad * 180 / Math.PI + 360) % 360;
}

function posFromAngle(deg, radius) {
  const rad = deg * Math.PI / 180;
  return {
    top: `${(50 - radius * Math.cos(rad)).toFixed(1)}%`,
    left: `${(50 + radius * Math.sin(rad)).toFixed(1)}%`,
    transform: 'translate(-50%, -50%)',
  };
}

/**
 * Returns `count` new {top,left,transform} positions on a ring of the given
 * radius, one per largest-remaining-gap insertion, without moving any of the
 * angles implied by `existingPositions`.
 */
export function nextRingSlots(existingPositions, count, radius) {
  if (count <= 0) return [];

  let angles = existingPositions.map(angleFromPos);

  if (angles.length === 0) {
    // Nothing to avoid — just space them evenly around the full circle.
    const step = 360 / count;
    return Array.from({ length: count }, (_, i) => posFromAngle(i * step, radius));
  }

  const newAngles = [];
  for (let n = 0; n < count; n++) {
    const all = [...angles, ...newAngles].sort((a, b) => a - b);
    let bestGap = -1;
    let bestMid = 0;
    for (let i = 0; i < all.length; i++) {
      const a = all[i];
      const b = i === all.length - 1 ? all[0] + 360 : all[i + 1];
      const gap = b - a;
      if (gap > bestGap) {
        bestGap = gap;
        bestMid = (a + b) / 2 % 360;
      }
    }
    newAngles.push(bestMid);
  }

  return newAngles.map(deg => posFromAngle(deg, radius));
}
