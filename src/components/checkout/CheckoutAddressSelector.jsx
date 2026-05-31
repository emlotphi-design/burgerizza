import SavedAddressCard from './SavedAddressCard';

export default function CheckoutAddressSelector({ savedAddress, onUseThis, onEnterNew }) {
  return (
    <div className="co-form co-addr-selector">
      <div className="co-form-header">
        <h2 className="co-form-title">Lieferadresse</h2>
        <p className="co-form-sub">Wir haben deine Lieferadresse gespeichert.</p>
      </div>

      <div className="co-addr-section">
        <div className="co-addr-section-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Gespeicherte Adresse
        </div>
        <SavedAddressCard address={savedAddress} />
      </div>

      <button type="button" className="co-next-btn" onClick={onUseThis}>
        Gespeicherte Adresse verwenden
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>

      <div className="co-addr-divider">
        <div className="co-addr-divider-line" />
        <span className="co-addr-divider-text">oder</span>
        <div className="co-addr-divider-line" />
      </div>

      <button type="button" className="co-addr-new-btn" onClick={onEnterNew}>
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
