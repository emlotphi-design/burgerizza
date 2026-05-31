/* Horizontal on desktop (>560px), vertical on mobile */

const STEPS = [
  {
    key: 'pending',
    label: 'Received',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    key: 'preparing',
    label: 'Preparing',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
        <line x1="6"  y1="1" x2="6"  y2="4"/>
        <line x1="10" y1="1" x2="10" y2="4"/>
        <line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
  },
  {
    key: 'ready',
    label: 'On the Way',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/>
        <path d="M16 8h4l3 3v5h-7V8z"/>
        <circle cx="5.5"  cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
];

const STEP_KEYS  = STEPS.map(s => s.key);
const NORMALISE  = { confirmed: 'pending' };

function CheckSVG() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function TrackingTimeline({ status }) {
  const norm         = NORMALISE[status] ?? status;
  const rawIdx       = STEP_KEYS.indexOf(norm);
  const effectiveIdx = rawIdx === -1 ? 0 : rawIdx;

  return (
    <div className="ot-timeline">
      {STEPS.map((step, i) => {
        const done   = i < effectiveIdx;
        const active = i === effectiveIdx;
        const cls    = done ? 'ot-tl-step--done' : active ? 'ot-tl-step--active' : 'ot-tl-step--upcoming';

        return (
          <div key={step.key} className={`ot-tl-step ${cls}`}>
            <div className="ot-tl-dot">
              {done ? <CheckSVG /> : step.icon}
            </div>
            <span className="ot-tl-label">{step.label}</span>

            {/* connector rendered as child — CSS positions it between this dot and next */}
            {i < STEPS.length - 1 && (
              <div className={`ot-tl-connector${done ? ' ot-tl-connector--lit' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
