import { nextRingSlots } from '../../../utils/ringLayout';

const RING_RADIUS = 42;

/**
 * Merges admin-created custom ingredients into a burger category's static
 * list + PREVIEWS/POSITIONS/BASES maps, slotting each new item into the
 * largest remaining angular gap (see ringLayout.js) so existing hand-placed
 * items never move. The single uploaded image plays every role (preview
 * thumbnail, base/top canvas layer) for a custom ingredient.
 */
export function mergeBurgerCategory(staticList, positionsMap, customRows) {
  if (customRows.length === 0) {
    return { list: staticList, positions: positionsMap, previews: {}, bases: {} };
  }

  const existingPositions = staticList.map(item => positionsMap[item.id]);
  const newPositions = nextRingSlots(existingPositions, customRows.length, RING_RADIUS);

  const list = [...staticList];
  const positions = { ...positionsMap };
  const previews = {};
  const bases = {};

  customRows.forEach((row, i) => {
    list.push({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      category: row.category,
      hasQty: row.category === 'meat' || row.category === 'cheese',
    });
    positions[row.id] = newPositions[i];
    previews[row.id] = row.image_url;
    bases[row.id] = row.image_url;
  });

  return { list, positions, previews, bases };
}
