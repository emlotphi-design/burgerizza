import SavedAddressCard from './SavedAddressCard';

export default function CheckoutAddressSelector({ savedAddress, onUseThis, onEnterNew }) {
  return (
    <div className="co-form">
      <div className="co-form-header">
        <h2 className="co-form-title">Lieferadresse auswählen</h2>
        <p className="co-form-sub">Wohin soll deine Bestellung geliefert werden?</p>
      </div>

      {/* Option A — previously saved address */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: '#8A7A6A',
          marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Gespeicherte Adresse
        </div>
        <SavedAddressCard address={savedAddress} />
      </div>

      <button type="button" className="co-next-btn" onClick={onUseThis}>
        Diese Adresse verwenden
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(26,10,0,0.10)' }} />
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#8A7A6A',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          oder
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(26,10,0,0.10)' }} />
      </div>

      {/* Option B — enter new address */}
      <button
        type="button"
        onClick={onEnterNew}
        style={{
          width:           '100%',
          height:           52,
          borderRadius:     14,
          border:          '1.5px solid rgba(26,10,0,0.18)',
          background:      'transparent',
          color:           '#1A0A00',
          fontFamily:      'Nunito, sans-serif',
          fontSize:         14,
          fontWeight:       800,
          cursor:          'pointer',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          gap:              8,
          transition:      'background 0.14s ease, border-color 0.14s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background    = 'rgba(26,10,0,0.04)';
          e.currentTarget.style.borderColor   = 'rgba(26,10,0,0.30)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background    = 'transparent';
          e.currentTarget.style.borderColor   = 'rgba(26,10,0,0.18)';
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        Neue Adresse eingeben
      </button>
    </div>
  );
}
