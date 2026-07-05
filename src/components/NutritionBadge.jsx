import { useId } from 'react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import '../styles/nutrition.css';

/**
 * Small reusable pill showing live calories, placed beside existing price
 * displays. The number animates smoothly toward its target via
 * useAnimatedNumber instead of jumping on every ingredient change.
 *
 * `premium` opts into the glassmorphism flame-icon variant (Pizza
 * Builder's floating badge only) without changing anything for every other
 * caller, which keeps rendering the plain emoji icon by default.
 */
export default function NutritionBadge({ calories, size = 'md', className = '', premium = false }) {
  const animated = useAnimatedNumber(calories ?? 0);
  const flameGradientId = useId();

  return (
    <span
      className={`nutrition-badge nutrition-badge--${size} ${premium ? 'nutrition-badge--premium' : ''} ${className}`.trim()}
    >
      <span className="nutrition-badge-icon" aria-hidden="true">
        {premium ? (
          <>
            <span className="nutrition-badge-icon-glow" />
            <svg className="nutrition-badge-flame" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id={flameGradientId} x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#FF6A00" />
                  <stop offset="55%" stopColor="#FF9500" />
                  <stop offset="100%" stopColor="#FFD54A" />
                </linearGradient>
              </defs>
              <path
                d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                fill={`url(#${flameGradientId})`}
              />
            </svg>
          </>
        ) : '🔥'}
      </span>
      <span className="nutrition-badge-value">{Math.round(animated)}</span>
      <span className="nutrition-badge-unit">kcal</span>
    </span>
  );
}
