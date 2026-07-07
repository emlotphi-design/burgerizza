const ETA_MAP = {
  pending:   { time: '30–40 min', label: 'Estimated arrival', pct: 8 },
  confirmed: { time: '28–35 min', label: 'Estimated arrival', pct: 15 },
  preparing: { time: '18–25 min', label: 'Estimated arrival', pct: 40 },
  ready:     { time: '5–12 min',  label: 'Arriving soon',     pct: 82 },
};

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="#FFD54A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

export default function ETACard({ status }) {
  const eta = ETA_MAP[status];
  if (!eta) return null;

  return (
    <div className="ot-card ot-eta" key={status}>
      <div className="ot-eta-top">
        <div className="ot-eta-icon-wrap"><ClockIcon /></div>
        <div>
          <div className="ot-eta-label">{eta.label}</div>
          <div className="ot-eta-time">{eta.time}</div>
        </div>
      </div>
      <div className="ot-eta-track">
        <div className="ot-eta-fill" style={{ width: `${eta.pct}%` }} />
        <div className="ot-eta-cursor" style={{ left: `${eta.pct}%` }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFD54A">
            <circle cx="12" cy="12" r="12"/>
          </svg>
        </div>
      </div>
      <div className="ot-eta-scale">
        <span>Now</span>
        <span>Delivery</span>
      </div>
    </div>
  );
}
