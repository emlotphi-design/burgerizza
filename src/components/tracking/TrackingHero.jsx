const STATUS_CFG = {
  pending:   { color: '#f59e0b', glow: 'rgba(245,158,11,0.22)', circleBg: 'rgba(245,158,11,0.12)', circleShadow: 'rgba(245,158,11,0.28)', label: 'Order Received' },
  confirmed: { color: '#f59e0b', glow: 'rgba(245,158,11,0.22)', circleBg: 'rgba(245,158,11,0.12)', circleShadow: 'rgba(245,158,11,0.28)', label: 'Confirmed' },
  preparing: { color: '#f97316', glow: 'rgba(249,115,22,0.22)', circleBg: 'rgba(249,115,22,0.12)', circleShadow: 'rgba(249,115,22,0.28)', label: 'In Kitchen' },
  ready:     { color: '#3b82f6', glow: 'rgba(59,130,246,0.24)', circleBg: 'rgba(59,130,246,0.12)', circleShadow: 'rgba(59,130,246,0.30)', label: 'On the Way' },
  delivered: { color: '#22c55e', glow: 'rgba(34,197,94,0.24)',  circleBg: 'rgba(34,197,94,0.12)',  circleShadow: 'rgba(34,197,94,0.30)',  label: 'Delivered' },
  cancelled: { color: '#ef4444', glow: 'rgba(239,68,68,0.22)',  circleBg: 'rgba(239,68,68,0.12)',  circleShadow: 'rgba(239,68,68,0.25)',  label: 'Cancelled' },
};

const ANIM = {
  pending:   'ot-hero-icon--float',
  confirmed: 'ot-hero-icon--float',
  preparing: 'ot-hero-icon--wobble',
  ready:     'ot-hero-icon--slide',
  delivered: 'ot-hero-icon--pop',
  cancelled: '',
};

function ReceiptSVG() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9"  x2="8"  y2="9"/>
    </svg>
  );
}

function CookSVG() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6"  y1="1" x2="6"  y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  );
}

function TruckSVG() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5"  cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

function CheckSVG() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function CrossSVG() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9"  x2="9"  y2="15"/>
      <line x1="9"  y1="9"  x2="15" y2="15"/>
    </svg>
  );
}

const ICON_MAP = {
  pending:   ReceiptSVG,
  confirmed: ReceiptSVG,
  preparing: CookSVG,
  ready:     TruckSVG,
  delivered: CheckSVG,
  cancelled: CrossSVG,
};

export default function TrackingHero({ status, headline, sub, orderId }) {
  const cfg  = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const anim = ANIM[status] ?? '';
  const Icon = ICON_MAP[status] ?? ReceiptSVG;

  return (
    <div className="ot-hero" style={{ '--hero-color': cfg.color, '--hero-glow': cfg.glow, '--circle-bg': cfg.circleBg, '--circle-shadow': cfg.circleShadow }}>
      <div className="ot-hero-glow" />

      {/* top row: order id + badge */}
      <div className="ot-hero-toprow">
        <span className="ot-hero-oid">#{orderId}</span>
        <span className="ot-hero-badge" style={{ color: cfg.color, background: cfg.glow }}>
          <span className="ot-hero-badge-dot" style={{ background: cfg.color }} />
          {cfg.label}
        </span>
      </div>

      {/* icon with pulse rings */}
      <div className="ot-hero-icon-section">
        {status !== 'cancelled' && (
          <>
            <div className="ot-ring ot-ring--1" />
            <div className="ot-ring ot-ring--2" />
          </>
        )}
        <div className="ot-hero-circle" style={{ '--hero-color': cfg.color }}>
          <div className={`ot-hero-icon-inner ${anim}`} style={{ color: cfg.color }}>
            <Icon />
          </div>
        </div>
      </div>

      {/* text */}
      <div className="ot-hero-texts">
        <h1 className="ot-hero-headline">{headline}</h1>
        {sub && <p className="ot-hero-sub">{sub}</p>}
      </div>
    </div>
  );
}
