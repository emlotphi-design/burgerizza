function fmt(n) { return '€' + Number(n).toFixed(2); }

function ShoppingBagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}

export default function OrderPreviewCard({ items, total }) {
  if (!items?.length) return null;

  return (
    <div className="ot-card ot-preview">
      <div className="ot-section-label">
        <ShoppingBagIcon />
        Your Order
        <span className="ot-section-label-count">{items.reduce((s, it) => s + (it.quantity ?? 1), 0)} items</span>
      </div>

      <div className="ot-preview-list">
        {items.map((item, i) => {
          const qty  = item.quantity ?? 1;
          const lineTotal = item.price ? fmt(item.price * qty) : null;
          const mods = [item.dough || item.bun, item.sauce, item.cheese]
            .filter(Boolean).join(' · ');

          return (
            <div key={i} className="ot-preview-item">
              <div className="ot-preview-emoji">
                {item.type === 'burger' ? '🍔' : '🍕'}
              </div>
              <div className="ot-preview-info">
                <span className="ot-preview-name">
                  {item.name || (item.type === 'burger' ? 'Custom Burger' : 'Custom Pizza')}
                </span>
                {mods && <span className="ot-preview-mods">{mods}</span>}
              </div>
              <div className="ot-preview-meta">
                {qty > 1 && <span className="ot-preview-qty">×{qty}</span>}
                {lineTotal && <span className="ot-preview-price">{lineTotal}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ot-preview-footer">
        <span>Total</span>
        <span className="ot-preview-total">{fmt(total)}</span>
      </div>
    </div>
  );
}
