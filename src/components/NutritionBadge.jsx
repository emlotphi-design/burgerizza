import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import '../styles/nutrition.css';

/**
 * Small reusable pill showing live calories, placed beside existing price
 * displays. The number animates smoothly toward its target via
 * useAnimatedNumber instead of jumping on every ingredient change.
 */
export default function NutritionBadge({ calories, size = 'md', className = '' }) {
  const animated = useAnimatedNumber(calories ?? 0);

  return (
    <span className={`nutrition-badge nutrition-badge--${size} ${className}`.trim()}>
      <span className="nutrition-badge-icon" aria-hidden="true">🔥</span>
      <span className="nutrition-badge-value">{Math.round(animated)}</span>
      <span className="nutrition-badge-unit">kcal</span>
    </span>
  );
}
