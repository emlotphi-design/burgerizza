import { useState } from 'react';

const CATEGORIES = [
  {
    emoji: '🍕',
    name: 'Pizzas',
    desc: 'Custom-built & classic pizzas',
    count: 'Builder + 6 classics',
    badge: 'active',
  },
  {
    emoji: '🍔',
    name: 'Burgers',
    desc: 'Custom-built burgers',
    count: 'Builder only',
    badge: 'active',
  },
  {
    emoji: '🥤',
    name: 'Drinks',
    desc: 'Soft drinks & juices',
    count: '8 items',
    badge: 'active',
  },
  {
    emoji: '🍰',
    name: 'Desserts',
    desc: 'Cakes, ice cream & more',
    count: '6 items',
    badge: 'active',
  },
];

const BADGE = {
  active:   <span className="adm-badge adm-badge--green">Active</span>,
  hidden:   <span className="adm-badge adm-badge--gray">Hidden</span>,
  draft:    <span className="adm-badge adm-badge--amber">Draft</span>,
};

export default function Products() {
  const [search, setSearch] = useState('');

  const filtered = CATEGORIES.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="adm-page-header">
        <h1 className="adm-page-title">Products</h1>
        <p className="adm-page-subtitle">Manage menu categories and items.</p>
      </div>

      <div className="adm-toolbar">
        <input
          className="adm-search"
          type="text"
          placeholder="Search categories…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="adm-btn adm-btn--primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          Add Category
        </button>
      </div>

      <div className="adm-card" style={{ marginBottom: 20 }}>
        <div className="adm-section-head">
          <span className="adm-section-title">Menu Categories</span>
          <span className="adm-table-muted" style={{ fontSize: 12, fontWeight: 700 }}>{filtered.length} categories</span>
        </div>
        {filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-emoji">🏷️</div>
            <div className="adm-empty-title">No categories found</div>
          </div>
        ) : (
          <div className="adm-product-grid">
            {filtered.map(c => (
              <div key={c.name} className="adm-product-card">
                <div className="adm-product-emoji">{c.emoji}</div>
                <div>
                  <div className="adm-product-name">{c.name}</div>
                  <div className="adm-product-meta">{c.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <div className="adm-product-meta">{c.count}</div>
                  {BADGE[c.badge]}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button className="adm-btn adm-btn--ghost" style={{ flex: 1, height: 28, fontSize: 11, padding: '0 8px' }}>Edit</button>
                  <button className="adm-btn adm-btn--ghost" style={{ height: 28, fontSize: 11, padding: '0 8px' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="adm-card">
        <div className="adm-section-head">
          <span className="adm-section-title">Builder Products</span>
          <span className="adm-table-muted" style={{ fontSize: 12, fontWeight: 700 }}>Custom ingredients</span>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Item</th>
                <th>Status</th>
                <th>Used in</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Bun',       item: '5 bun varieties',       status: 'active', usedIn: 'Burger Builder' },
                { type: 'Meat',      item: '6 meat options',         status: 'active', usedIn: 'Burger Builder' },
                { type: 'Cheese',    item: '3 cheese types',         status: 'active', usedIn: 'Burger + Pizza' },
                { type: 'Vegetable', item: '5 vegetable options',    status: 'active', usedIn: 'Burger + Pizza' },
                { type: 'Sauce',     item: '5 sauces',               status: 'active', usedIn: 'Burger Builder' },
                { type: 'Dough',     item: '3 dough types',          status: 'active', usedIn: 'Pizza Builder' },
              ].map(r => (
                <tr key={r.type}>
                  <td style={{ fontWeight: 900 }}>{r.type}</td>
                  <td className="adm-table-muted">{r.item}</td>
                  <td><span className="adm-badge adm-badge--green">Active</span></td>
                  <td className="adm-table-muted">{r.usedIn}</td>
                  <td>
                    <button className="adm-btn adm-btn--ghost" style={{ height: 28, padding: '0 10px', fontSize: 11 }}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
