import { useState } from 'react';

function AddressRadioCard({ address, selected, onSelect }) {
  const isSelected = selected === address.id;
  return (
    <button
      type="button"
      className={`co-multi-addr-option${isSelected ? ' co-multi-addr-option--selected' : ''}`}
      onClick={() => onSelect(address.id)}
    >
      <div className="co-multi-addr-radio">
        {isSelected && <div className="co-multi-addr-radio-dot" />}
      </div>
      <div className="co-multi-addr-info">
        <div className="co-multi-addr-label">
          {address.label}
          {address.is_default && (
            <span className="co-multi-addr-default-chip">Standard</span>
          )}
        </div>
        <div className="co-multi-addr-detail">
          {address.street} {address.house_number}
          {address.floor ? `, ${address.floor}` : ''}
        </div>
        <div className="co-multi-addr-detail">
          {address.postal_code} {address.city}
        </div>
        {address.phone && (
          <div className="co-multi-addr-detail" style={{ marginTop: 2, opacity: 0.7 }}>
            {address.phone}
          </div>
        )}
      </div>
    </button>
  );
}

export default function MultiAddressSelector({ addresses, defaultAddress, onUseAddress, onEnterNew }) {
  const [selectedId, setSelectedId] = useState(defaultAddress?.id ?? addresses[0]?.id ?? null);

  function handleUse() {
    const addr = addresses.find(a => a.id === selectedId) ?? addresses[0];
    if (addr) onUseAddress(addr);
  }

  return (
    <div className="co-form co-addr-selector">
      <div className="co-form-header">
        <h2 className="co-form-title">Lieferadresse</h2>
        <p className="co-form-sub">Wähle deine Lieferadresse.</p>
      </div>

      <div className="co-multi-addr">
        {addresses.map(addr => (
          <AddressRadioCard
            key={addr.id}
            address={addr}
            selected={selectedId}
            onSelect={setSelectedId}
          />
        ))}
      </div>

      <button type="button" className="co-next-btn" onClick={handleUse} style={{ marginTop: 16 }}>
        Diese Adresse verwenden
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
