const ETA_MAP = {
  pending:   { time: '30–40 min', label: 'Estimated arrival', pct: 8 },
  confirmed: { time: '28–35 min', label: 'Estimated arrival', pct: 15 },
  preparing: { time: '18–25 min', label: 'Estimated arrival', pct: 40 },
  ready:     { time: '5–12 min',  label: 'Arriving soon',     pct: 82 },
};

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#FFD54A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.65)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function ETACard({ status }) {
  const eta = ETA_MAP[status];
  if (!eta) return null;

  return (
    <div className="ot-card ot-eta">
      <div className="ot-eta-top">
        <div className="ot-eta-icon-wrap"><ClockIcon /></div>
        <div className="ot-eta-body">
          <div className="ot-eta-label">{eta.label}</div>
          <div className="ot-eta-time">{eta.time}</div>
        </div>
      </div>
      {/* progress bar */}
      <div className="ot-eta-track">
        <div className="ot-eta-fill" style={{ width: `${eta.pct}%` }} />
        <div className="ot-eta-cursor" style={{ left: `${eta.pct}%` }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFD54A">
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

function DriverCard() {
  return (
    <div className="ot-card ot-driver">
      <div className="ot-driver-avatar">
        <UserIcon />
      </div>
      <div className="ot-driver-body">
        <div className="ot-driver-name">Driver is on the way</div>
        <div className="ot-driver-sub">
          <MapPinIcon />
          Heading to your address
        </div>
      </div>
      <div className="ot-driver-live">
        <div className="ot-driver-pulse" />
        <span>Live</span>
      </div>
    </div>
  );
}

export default function DeliveryStatusCard({ status }) {
  return (
    <>
      <ETACard status={status} />
      {status === 'ready' && <DriverCard />}
    </>
  );
}
