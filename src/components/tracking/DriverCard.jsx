// Restaurant contact number — same one used by the "Contact Restaurant" CTA.
// Real per-driver phone numbers live in the `drivers` table, which RLS
// restricts to authenticated staff/admin; anonymous customers can only read
// `orders.driver_name`, so the Call button reaches the restaurant instead.
const RESTAURANT_TEL = '+49123456789';

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '?';
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

export default function DriverCard({ driverName }) {
  if (!driverName) return null;

  return (
    <div className="ot-card ot-driver">
      <div className="ot-driver-avatar">{initials(driverName)}</div>

      <div className="ot-driver-body">
        <div className="ot-driver-name">{driverName}</div>
        <div className="ot-driver-sub">
          <MapPinIcon />
          Heading to your address
        </div>
      </div>

      <div className="ot-driver-live">
        <div className="ot-driver-pulse" />
        Live
      </div>

      <a className="ot-driver-call" href={`tel:${RESTAURANT_TEL}`} aria-label="Call restaurant about your driver">
        <PhoneIcon />
      </a>
    </div>
  );
}
