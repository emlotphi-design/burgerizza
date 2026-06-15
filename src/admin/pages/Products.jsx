import { useEffect, useState } from 'react';
import '../styles/products.css';
import '../styles/forms.css';
import '../styles/modal.css';
import {
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
} from '../services/adminService';
import Modal from '../components/ui/Modal';
import Toggle from '../components/ui/Toggle';

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
            await onSave(product?.id ?? null, {
                name: form.name.trim(),
                description: form.description.trim(),
                price,
                category: form.category,
                emoji: form.emoji.trim() || '🍔',
                active: form.active,
                sort_order: Number(form.sort_order) || 0,
            });
            onClose();
        } catch (e) {
            setErr(e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal title={product ? 'Edit Product' : 'Add Product'} onClose={onClose}>
            <form className="admin-modal-body" onSubmit={handleSubmit}>
                <div className="admin-form-row">
                    <label className="admin-form-label">Name *</label>
                    <input className="admin-form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Classic Burger" />
                </div>
                <div className="admin-form-row">
                    <label className="admin-form-label">Description</label>
                    <input className="admin-form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description" />
                </div>
                <div className="admin-form-2col">
                    <div className="admin-form-row">
                        <label className="admin-form-label">Price (€) *</label>
                        <input className="admin-form-input" type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="9.99" />
                    </div>
                    <div className="admin-form-row">
                        <label className="admin-form-label">Emoji</label>
                        <input className="admin-form-input" value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="🍔" maxLength={4} />
                    </div>
                </div>
                <div className="admin-form-2col">
                    <div className="admin-form-row">
                        <label className="admin-form-label">Category</label>
                        <select className="admin-form-input admin-products-select" value={form.category} onChange={e => set('category', e.target.value)}>
                            {CATEGORY_OPTIONS.map(c => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="admin-form-row">
                        <label className="admin-form-label">Sort order</label>
                        <input className="admin-form-input" type="number" min="0" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
                    </div>
                </div>
                <div className="admin-form-row admin-form-row--inline">
                    <label className="admin-form-label">Active</label>
                    <Toggle on={form.active} onChange={() => set('active', !form.active)} label="Active" />
                </div>
                {err && <div className="admin-form-err">{err}</div>}
                <div className="admin-modal-footer" style={{ padding: 0, border: 'none' }}>
                    <button type="button" className="admin-form-btn" onClick={onClose}>Cancel</button>
                    <button type="submit" className="admin-form-btn admin-form-btn--primary" disabled={saving}>
                        {saving ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
                    </button>
                </div>
            </form>
        </Modal>
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
        <Modal title="Delete Product" onClose={onClose} size="sm">
            <div className="admin-modal-body" style={{ paddingBottom: 0 }}>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.72)' }}>
                    Delete <strong style={{ color: 'rgba(255,255,255,0.92)' }}>{product.name}</strong>?
                    This cannot be undone.
                </p>
            </div>
            <div className="admin-modal-footer">
                <button className="admin-form-btn" onClick={onClose}>Cancel</button>
                <button className="admin-form-btn admin-form-btn--danger" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Delete'}
                </button>
            </div>
        </Modal>
    );
}

export default function Products() {
    const [products,  setProducts]  = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState(null);
    const [search,    setSearch]    = useState('');
    const [catFilter, setCat]       = useState('all');
    const [modal,     setModal]     = useState(null);
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
        <div className="admin-products-page">
            {modal === 'add' && (
                <ProductModal onSave={handleSave} onClose={() => setModal(null)} />
            )}
            {modal?.product && (
                <ProductModal product={modal.product} onSave={handleSave} onClose={() => setModal(null)} />
            )}
            {delTarget && (
                <DeleteConfirm product={delTarget} onConfirm={handleDelete} onClose={() => setDelTarget(null)} />
            )}

            <div className="admin-page-header">
                <div>
                    <h2>Products</h2>
                    <p className="admin-page-subtitle">Manage your menu items.</p>
                </div>
                <div className="admin-page-actions">
                    <button className="admin-btn admin-btn--primary" onClick={() => setModal('add')}>
                        + Add Product
                    </button>
                </div>
            </div>

            <div className="admin-products-toolbar">
                <input
                    className="admin-products-search"
                    type="text"
                    placeholder="Search products…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select
                    className="admin-products-select"
                    value={catFilter}
                    onChange={e => setCat(e.target.value)}
                >
                    {categories.map(c => (
                        <option key={c} value={c}>
                            {c === 'all' ? 'All categories' : c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {error && <div className="admin-products-error">Failed to load: {error}</div>}

            <div className="admin-products-panel">
                <div className="admin-products-panel-head">
                    <span className="admin-products-panel-title">Menu Items</span>
                    <span className="admin-products-count">{filtered.length} items</span>
                </div>

                {loading ? (
                    <div className="admin-products-empty">
                        <span className="admin-products-empty-sub">Loading products…</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="admin-products-empty">
                        <span className="admin-products-empty-emoji">🏷️</span>
                        <span className="admin-products-empty-title">No products found</span>
                        <span className="admin-products-empty-sub">Add your first product or adjust the search.</span>
                    </div>
                ) : (
                    <div className="admin-products-grid">
                        {filtered.map(p => (
                            <div key={p.id} className={`admin-product-card${p.active ? '' : ' admin-product-card--inactive'}`}>
                                <div className="admin-product-emoji">{p.emoji}</div>
                                <div className="admin-product-name">{p.name}</div>
                                {p.description && (
                                    <div className="admin-product-desc">{p.description}</div>
                                )}
                                <div className="admin-product-meta-row">
                                    <div className="admin-product-price">€{Number(p.price).toFixed(2)}</div>
                                    {p.active
                                        ? <span className="admin-product-badge-active">Active</span>
                                        : <span className="admin-product-badge-hidden">Hidden</span>
                                    }
                                </div>
                                <div className="admin-product-cat">{p.category}</div>
                                <div className="admin-product-actions">
                                    <button className="admin-product-btn" onClick={() => setModal({ product: p })}>
                                        Edit
                                    </button>
                                    <button
                                        className="admin-product-btn admin-product-btn--icon"
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
                                        className="admin-product-btn admin-product-btn--icon admin-product-btn--danger"
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
        </div>
    );
}
