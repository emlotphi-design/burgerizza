export default function SavedAddressCard({ address }) {
  return (
    <div style={{
      background:    'rgba(26,10,0,0.04)',
      border:        '1.5px solid rgba(26,10,0,0.12)',
      borderRadius:   16,
      padding:       '16px 18px',
      display:       'flex',
      flexDirection: 'column',
      gap:            5,
    }}>
      <div style={{ fontWeight: 900, fontSize: 15, color: '#1A0A00' }}>
        {address.fullName}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#3A2A10' }}>
        {address.street} {address.houseNumber}
      </div>
      {(address.floor || address.doorbellName) && (
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7A5A' }}>
          {address.floor ? `Etage: ${address.floor}` : ''}
          {address.floor && address.doorbellName ? ' · ' : ''}
          {address.doorbellName ? `Klingel: ${address.doorbellName}` : ''}
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#3A2A10' }}>
        {address.postalCode} {address.city}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: '#3A2A10',
        marginTop: 4, display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
        </svg>
        {address.phone}
      </div>
    </div>
  );
}
