export default function SavedAddressCard({ address }) {
  return (
    <div className="co-saved-addr-card">
      <div className="co-saved-addr-name">{address.fullName}</div>
      <div className="co-saved-addr-line">{address.street} {address.houseNumber}</div>
      {(address.floor || address.doorbellName) && (
        <div className="co-saved-addr-detail">
          {address.floor ? `Etage: ${address.floor}` : ''}
          {address.floor && address.doorbellName ? ' · ' : ''}
          {address.doorbellName ? `Klingel: ${address.doorbellName}` : ''}
        </div>
      )}
      <div className="co-saved-addr-line">{address.postalCode} {address.city}</div>
      <div className="co-saved-addr-phone">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
        </svg>
        {address.phone}
      </div>
    </div>
  );
}
