import { useEffect, useRef } from 'react';

/**
 * Pseudo-3D vector background for the Inventory category panel — depth
 * built entirely from layered SVG (no CSS boxes, no images): a distant
 * layer of soft blurred blobs, a mid layer of translucent floating "planes"
 * with their own SVG drop-shadow and gradient, and a near layer of thin
 * highlight lines/curves. Each layer drifts a different amount on mouse
 * move (parallax), giving the composition depth without any skeuomorphism
 * or gloss — just soft gradients, shadows and low-opacity vector shapes.
 * Colors come from CSS custom properties on `.inv-detail` (theme + the
 * category's own accent color); the center stays empty for the cards.
 */

// How far each depth layer travels relative to the cursor — the "nearest"
// layer moves most, giving the parallax illusion. Values are in the SVG's
// own viewBox units (400x260), so they stay small and subtle.
const PARALLAX = { far: 3, mid: 7, near: 13 };

export default function InventoryPanelArt() {
  const svgRef  = useRef(null);
  const farRef  = useRef(null);
  const midRef  = useRef(null);
  const nearRef = useRef(null);
  const rafRef  = useRef(null);

  useEffect(() => {
    const panel = svgRef.current?.closest('.inv-detail');
    if (!panel) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const apply = (nx, ny) => {
      if (farRef.current)  farRef.current.style.transform  = `translate(${(nx * PARALLAX.far).toFixed(2)}px, ${(ny * PARALLAX.far).toFixed(2)}px)`;
      if (midRef.current)  midRef.current.style.transform  = `translate(${(nx * PARALLAX.mid).toFixed(2)}px, ${(ny * PARALLAX.mid).toFixed(2)}px)`;
      if (nearRef.current) nearRef.current.style.transform = `translate(${(nx * PARALLAX.near).toFixed(2)}px, ${(ny * PARALLAX.near).toFixed(2)}px)`;
    };

    const handleMove = (e) => {
      const rect = panel.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => apply(nx, ny));
    };

    const handleLeave = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => apply(0, 0));
    };

    panel.addEventListener('mousemove', handleMove);
    panel.addEventListener('mouseleave', handleLeave);
    return () => {
      panel.removeEventListener('mousemove', handleMove);
      panel.removeEventListener('mouseleave', handleLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="inv-panel-bg"
      viewBox="0 0 400 260"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="inv-panel-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="var(--inv-panel-fill-a)" />
          <stop offset="55%"  stopColor="var(--inv-panel-fill-b)" />
          <stop offset="100%" stopColor="var(--inv-panel-fill-c)" />
        </linearGradient>

        <linearGradient id="inv-plane-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="rgb(var(--inv-accent))" stopOpacity="0.12" />
          <stop offset="100%" stopColor="rgb(var(--inv-accent))" stopOpacity="0.015" />
        </linearGradient>

        <filter id="inv-blob-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>

        {/* Ambient shadow for the mid-layer planes — vector-native, not a CSS box-shadow */}
        <filter id="inv-plane-shadow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000000" floodOpacity="0.16" />
        </filter>
      </defs>

      {/* Base ambient fill — the only "background", replacing a flat CSS rect */}
      <rect className="inv-panel-fill-rect" x="-20" y="-20" width="440" height="300" fill="url(#inv-panel-fill)" />

      {/* ── Far layer: soft blurred blobs, moves least ── */}
      <g ref={farRef} className="inv-panel-layer" filter="url(#inv-blob-blur)">
        <circle cx="16"  cy="10"  r="34" fill="rgb(var(--inv-accent))" opacity="0.10" />
        <circle cx="392" cy="16"  r="24" fill="rgb(var(--inv-accent))" opacity="0.07" />
        <circle cx="396" cy="252" r="42" fill="rgb(var(--inv-accent))" opacity="0.08" />
        <circle cx="6"   cy="250" r="22" fill="rgb(var(--inv-accent))" opacity="0.06" />
      </g>

      {/* ── Mid layer: translucent floating planes with their own gradient +
         soft ambient shadow — the main "depth" cue. Corners only. ── */}
      <g ref={midRef} className="inv-panel-layer">
        <rect
          x="318" y="-34" width="126" height="82" rx="20"
          transform="rotate(16 381 7)"
          fill="url(#inv-plane-fill)"
          filter="url(#inv-plane-shadow)"
        />
        <path
          d="M 324 -20 L 434 -2" stroke="var(--inv-panel-line)" strokeWidth="1"
          opacity="0.30" vectorEffect="non-scaling-stroke"
        />
        <rect
          x="-46" y="206" width="112" height="74" rx="18"
          transform="rotate(-13 10 243)"
          fill="url(#inv-plane-fill)"
          filter="url(#inv-plane-shadow)"
        />
        <path
          d="M -38 218 L 60 234" stroke="var(--inv-panel-line)" strokeWidth="1"
          opacity="0.26" vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* ── Near layer: thin curves, corner lines and highlight dots — moves
         most, sits "closest" to the viewer. Center stays clean. ── */}
      <g ref={nearRef} className="inv-panel-layer" fill="none" stroke="var(--inv-panel-line)" strokeWidth="1">
        <path d="M -10 42 C 42 8, 66 58, 128 18"     opacity="0.28" vectorEffect="non-scaling-stroke" />
        <path d="M 410 62 C 352 92, 330 28, 278 54"   opacity="0.24" vectorEffect="non-scaling-stroke" />
        <path d="M -10 226 C 48 198, 58 248, 118 232" opacity="0.24" vectorEffect="non-scaling-stroke" />
        <path d="M 410 206 C 342 238, 320 188, 268 218" opacity="0.28" vectorEffect="non-scaling-stroke" />
        <circle cx="58"  cy="24"  r="2.5" opacity="0.32" fill="var(--inv-panel-line)" stroke="none" />
        <circle cx="338" cy="232" r="2.5" opacity="0.32" fill="var(--inv-panel-line)" stroke="none" />
        <g opacity="0.15">
          <line x1="0" y1="0" x2="44" y2="0"   vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="0" x2="0"  y2="44"  vectorEffect="non-scaling-stroke" />
          <line x1="400" y1="260" x2="356" y2="260" vectorEffect="non-scaling-stroke" />
          <line x1="400" y1="260" x2="400" y2="216" vectorEffect="non-scaling-stroke" />
        </g>
      </g>
    </svg>
  );
}
