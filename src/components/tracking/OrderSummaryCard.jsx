import { useState } from 'react';

function fmt(n) { return '€' + Number(n).toFixed(2); }

function ChevronIcon({ open }) {
  return (
    <svg
      className={`ot-summary-chevron${open ? ' ot-summary-chevron--open' : ''}`}
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

export default function OrderSummaryCard({ items, total }) {
  const [open, setOpen] = useState(false);
  if (!items?.length) return null;

  const itemCount = items.reduce((s, it) => s + (it.quantity ?? 1), 0);
  const coverEmoji = items[0]?.type === 'burger' ? '🍔' : '🍕';

  return (
    <div className="ot-card ot-summary">
      <button
        type="button"
        className="ot-summary-collapsed"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <div className="ot-summary-thumb">{coverEmoji}</div>
        <div className="ot-summary-info">
          <div className="ot-summary-count">{itemCount} item{itemCount === 1 ? '' : 's'}</div>
          <div className="ot-summary-total">Total {fmt(total)}</div>
        </div>
        <ChevronIcon open={open} />
      </button>

      <div className={`ot-summary-body${open ? ' ot-summary-body--open' : ''}`}>
        <div className="ot-summary-body-inner">
          <div className="ot-preview-list">
            {items.map((item, i) => {
              const qty = item.quantity ?? 1;
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
      </div>
    </div>
  );
}
