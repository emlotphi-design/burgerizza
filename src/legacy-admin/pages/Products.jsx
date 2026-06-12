import { useEffect, useState } from 'react';
import {
  fetchProducts, createProduct, updateProduct,
  deleteProduct, toggleProductActive,
} from '../services/adminService';

const CATEGORY_OPTIONS = ['burger', 'pizza', 'sides', 'drinks', 'desserts', 'other'];

const EMPTY_FORM = {
  name: '', description: '', price: '', category: 'burger',
  emoji: '🍔', active: true, sort_order: 0,
};

function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState(product ? {
    name: product.name,
    description: product.description || '',
    price: String(product.price),
    category: product.category,
    emoji: product.emoji,
    active: product.active,
    sort_order: product.sort_order ?? 0,
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Name is required.'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setErr('Enter a valid price.'); return; }
    setSaving(true);
    setErr('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        category: form.category,
        emoji: form.emoji.trim() || '🍔',
        active: form.active,
        sort_order: Number(form.sort_order) || 0,
      };
      await onSave(product?.id ?? null, payload);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal-card" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <span className="adm-modal-title">{product ? 'Edit Product' : 'Add Product'}</span>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="adm-modal-body adm-form" onSubmit={handleSubmit}>
          <div className="adm-form-row">
            <label className="adm-form-label">Name *</label>
            <input className="adm-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Classic Burger" />
          </div>
          <div className="adm-form-row">
            <label className="adm-form-label">Description</label>
            <input className="adm-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description" />
          </div>
          <div className="adm-form-2col">
            <div className="adm-form-row">
              <label className="adm-form-label">Price (€) *</label>
              <input className="adm-input" type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="9.99" />
            </div>
            <div className="adm-form-row">
              <label className="adm-form-label">Emoji</label>
              <input className="adm-input" value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="🍔" maxLength={4} />
            </div>
          </div>
          <div className="adm-form-2col">
            <div className="adm-form-row">
              <label className="adm-form-label">Category</label>
              <select className="adm-select adm-input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="adm-form-row">
              <label className="adm-form-label">Sort order</label>
              <input className="adm-input" type="number" min="0" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
            </div>
          </div>
          <div className="adm-form-row adm-form-row--inline">
            <label className="adm-form-label">Active</label>
            <button
              type="button"
              className={`adm-toggle${form.active ? ' adm-toggle--on' : ''}`}
              onClick={() => set('active', !form.active)}
            >
              <span className="adm-toggle-knob" />
            </button>
          </div>

          {err && <div style={{ color: 'var(--adm-danger, #e03d3d)', fontSize: 13 }}>{err}</div>}

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirm({ product, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);
  async function handleDelete() {
    setDeleting(true);
    try { await onConfirm(product.id); onClose(); }
    finally { setDeleting(false); }
  }
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal-card adm-modal-card--sm" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <span className="adm-modal-title">Delete Product</span>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="adm-modal-body" style={{ paddingBottom: 0 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            Delete <strong>{product.name}</strong>? This cannot be undone.
          </p>
        </div>
        <div className="adm-modal-footer">
          <button className="adm-btn adm-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn--danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [catFilter, setCat]       = useState('all');
  const [modal, setModal]         = useState(null); // null | 'add' | { product }
  const [delTarget, setDelTarget] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try { setProducts(await fetchProducts()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleSave(id, payload) {
    if (id) {
      const updated = await updateProduct(id, payload);
      setProducts(prev => prev.map(p => p.id === id ? updated : p));
    } else {
      const created = await createProduct(payload);
      setProducts(prev => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
    }
  }

  async function handleDelete(id) {
    await deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function handleToggle(product) {
    const updated = await toggleProductActive(product.id, !product.active);
    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
  }

  const categories = ['all', ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <>
      {modal === 'add' && (
        <ProductModal onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {modal?.product && (
        <ProductModal product={modal.product} onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {delTarget && (
        <DeleteConfirm product={delTarget} onConfirm={handleDelete} onClose={() => setDelTarget(null)} />
      )}

      <div className="adm-page-header">
        <h1 className="adm-page-title">Products</h1>
        <p className="adm-page-subtitle">Manage your menu items.</p>
      </div>

      <div className="adm-toolbar">
        <input
          className="adm-search"
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="adm-select" value={catFilter} onChange={e => setCat(e.target.value)}>
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <button className="adm-btn adm-btn--primary" onClick={() => setModal('add')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Product
        </button>
      </div>

      {error && (
        <div className="adm-card" style={{ marginBottom: 16, color: 'var(--adm-danger, #e03d3d)', fontSize: 13 }}>
          Failed to load products: {error}
        </div>
      )}

      <div className="adm-card">
        <div className="adm-section-head">
          <span className="adm-section-title">Menu Items</span>
          <span className="adm-table-muted" style={{ fontSize: 12, fontWeight: 700 }}>{filtered.length} items</span>
        </div>
        {loading ? (
          <div className="adm-empty"><div className="adm-empty-sub">Loading products…</div></div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-emoji">🏷️</div>
            <div className="adm-empty-title">No products found</div>
            <div className="adm-empty-sub">Add your first product or adjust the search.</div>
          </div>
        ) : (
          <div className="adm-product-grid">
            {filtered.map(p => (
              <div key={p.id} className={`adm-product-card${p.active ? '' : ' adm-product-card--inactive'}`}>
                <div className="adm-product-emoji">{p.emoji}</div>
                <div>
                  <div className="adm-product-name">{p.name}</div>
                  <div className="adm-product-meta">{p.description || '—'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <div className="adm-product-price">€{Number(p.price).toFixed(2)}</div>
                  {p.active
                    ? <span className="adm-badge adm-badge--green">Active</span>
                    : <span className="adm-badge adm-badge--gray">Hidden</span>
                  }
                </div>
                <div className="adm-product-cat">{p.category}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <button
                    className="adm-btn adm-btn--ghost"
                    style={{ flex: 1, height: 36, fontSize: 12, padding: '0 10px' }}
                    onClick={() => setModal({ product: p })}
                  >
                    Edit
                  </button>
                  <button
                    className="adm-btn adm-btn--ghost"
                    style={{ height: 36, width: 36, padding: 0, justifyContent: 'center' }}
                    title={p.active ? 'Deactivate' : 'Activate'}
                    onClick={() => handleToggle(p)}
                  >
                    {p.active ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                  <button
                    className="adm-btn adm-btn--danger"
                    style={{ height: 36, width: 36, padding: 0, justifyContent: 'center' }}
                    onClick={() => setDelTarget(p)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    </>
  );
}
