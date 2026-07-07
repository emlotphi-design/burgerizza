import { useState, useMemo, useEffect } from 'react';
import { useAllIngredients } from '../utils/useAllIngredients';
import { getCategoryIcon, getCategoryColor } from '../utils/inventoryIcons';
import Modal from '../components/ui/Modal';
import InventoryPanelArt from '../components/ui/InventoryPanelArt';
import {
  fetchInventoryCategories, fetchInventoryItems, createInventoryItem,
  updateInventoryItem, setInventoryStock, archiveInventoryItem, recordInventoryWaste,
  fetchConsumptionRules, upsertConsumptionRule, removeConsumptionRule,
} from '../services/adminService';
import '../styles/inventory.css';

/**
 * Inventory — visual browser built directly on top of the existing
 * Ingredients data (same real preview/base images, nothing duplicated, no
 * image upload/picker). Persisted to Supabase (inventory_categories/items,
 * migrations 021-024): every stock change goes through set_inventory_stock
 * or record_inventory_waste so inventory_transactions stays a complete,
 * permanent ledger — current_stock itself is never written directly from
 * this page outside those two RPCs.
 */

const CATEGORIES = ['Refrigerated', 'Bread & Dough', 'Boxes & Packaging', 'Drinks'];

const CLOSE_ANIM_MS = 220;

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'pcs' },
  { value: 'g',   label: 'g' },
  { value: 'kg',  label: 'kg' },
  { value: 'ml',  label: 'ml' },
  { value: 'l',   label: 'L' },
];
const UNIT_LABELS = Object.fromEntries(UNIT_OPTIONS.map(u => [u.value, u.label]));

const STOCK_FILTERS = [
  { value: 'all',          label: 'All' },
  { value: 'in_stock',     label: 'In Stock' },
  { value: 'low',          label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

// Still used for the search/quick-filter chips (reorder urgency, based on
// minimumStock) — independent of the card's percentage-fill badge below.
function stockStatus(item) {
  if (item.currentStock <= 0) return 'out_of_stock';
  if (item.minimumStock > 0 && item.currentStock <= item.minimumStock) return 'low';
  return 'in_stock';
}

// The card's badge: how full the item is relative to its maximum capacity.
function stockPercent(item) {
  if (!item.maximumStock || item.maximumStock <= 0) return 0;
  const pct = (item.currentStock / item.maximumStock) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function percentBadgeClass(pct) {
  if (pct >= 75) return 'adm-badge--green';
  if (pct >= 50) return 'adm-badge--amber';
  return 'adm-badge--red';
}

const INVENTORY_DELETE_PIN = '3557';

// Maps a real pizza/burger ingredient category to one of the four
// Inventory sections — used only when seeding a category from ingredients.
function initialInventoryCategory(ingredientCategory) {
  if (ingredientCategory === 'dough' || ingredientCategory === 'bun') return 'Bread & Dough';
  return 'Refrigerated';
}

function initialUnit(ingredientCategory) {
  return (ingredientCategory === 'dough' || ingredientCategory === 'bun') ? 'pcs' : 'g';
}

function initialStock(unit) {
  return unit === 'pcs' ? 50 : 2000;
}

function fmtQty(value, unit) {
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${UNIT_LABELS[unit] ?? unit}`;
}

// DB row (snake_case, category_id FK) -> local item shape (camelCase, category name).
function rowToItem(row, categoryNameById) {
  const currentStock = Number(row.current_stock);
  return {
    id: row.id,
    name: row.name,
    image: row.image_url || null,
    category: categoryNameById[row.category_id] ?? 'Refrigerated',
    unit: row.unit,
    currentStock,
    minimumStock: Number(row.minimum_stock),
    maximumStock: row.maximum_stock != null ? Number(row.maximum_stock) : (currentStock || 1),
    purchasePrice: row.purchase_price != null ? Number(row.purchase_price) : null,
    supplier: row.supplier ?? null,
    purchaseDate: row.last_purchase_date ?? null,
    expirationDate: row.expiration_date ?? null,
    notes: row.notes ?? '',
  };
}

// Local form fields (excluding currentStock, which only ever moves through
// setInventoryStock/recordInventoryWaste) -> a plain inventory_items update.
function formToRow(form, categoryIdByName) {
  return {
    category_id: categoryIdByName[form.category],
    unit: form.unit,
    minimum_stock: form.minimumStock,
    maximum_stock: form.maximumStock,
    purchase_price: form.purchasePrice,
    supplier: form.supplier,
    last_purchase_date: form.purchaseDate,
    expiration_date: form.expirationDate,
    notes: form.notes,
  };
}

/* ── Category home tile ───────────────────────────────────────────────────── */
function CategoryHomeCard({ category, count, onSelect }) {
  const Icon = getCategoryIcon(category);
  const color = getCategoryColor(category);
  return (
    <button
      type="button"
      className="inv-home-card"
      style={{ '--inv-accent': color.rgb }}
      onClick={onSelect}
    >
      <div className="inv-home-icon"><Icon /></div>
      <div className="inv-home-name">{category}</div>
      <div className="inv-home-count">{count} product{count === 1 ? '' : 's'}</div>
    </button>
  );
}

/* ── Item card — Current Stock is the dominant element, per requirement ── */
function ItemCard({ item, Icon, onEdit, onDelete, onWaste }) {
  const pct = stockPercent(item);

  return (
    <div className="inv-item-card">
      <span className={`adm-badge ${percentBadgeClass(pct)} inv-item-badge`}>{pct}%</span>

      <div className="inv-item-image-wrap">
        {item.image ? (
          <img src={item.image} alt={item.name} className="inv-item-image" />
        ) : (
          <div className="inv-item-image-fallback"><Icon /></div>
        )}
      </div>

      <div className="inv-item-name">{item.name}</div>

      <div className="inv-item-stock-block">
        <span className="inv-item-stock-label">Current Stock</span>
        <span className="inv-item-stock-value">{fmtQty(item.currentStock, item.unit)}</span>
      </div>

      <div className="inv-item-meta">Min {fmtQty(item.minimumStock, item.unit)}</div>

      <div className="inv-item-actions">
        <button type="button" className="adm-btn adm-btn--ghost inv-item-edit-btn" onClick={() => onEdit(item)}>
          Edit
        </button>
        <button type="button" className="adm-btn adm-btn--ghost inv-item-waste-btn" onClick={() => onWaste(item)}>
          Waste
        </button>
        <button type="button" className="adm-btn adm-btn--ghost inv-item-delete-btn" onClick={() => onDelete(item)}>
          Delete
        </button>
      </div>
    </div>
  );
}

/* ── Category detail — search, quick filters, Add Inventory Item, item grid ── */
function CategoryDetail({ category, items, seedCandidates, onBack, onEdit, onDelete, onWaste, onAdd, onSeed, seeding }) {
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState('all');
  const Icon = getCategoryIcon(category);
  const color = getCategoryColor(category);

  const filtered = items.filter(item => {
    if (filter !== 'all' && stockStatus(item) !== filter) return false;
    if (query.trim() && !item.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <section className="inv-detail" style={{ '--inv-accent': color.rgb }}>
      <InventoryPanelArt />
      <button type="button" className="adm-btn adm-btn--ghost inv-back-btn" onClick={onBack}>← Categories</button>

      <div className="inv-detail-header">
        <div className="inv-detail-icon"><Icon /></div>
        <h3 className="inv-detail-title">{category}</h3>
        <span className="inv-detail-count">{items.length} products</span>
      </div>

      <div className="inv-toolbar">
        <input
          className="adm-input inv-search-input"
          type="text"
          placeholder={`Search ${category}…`}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="inv-filter-chips">
          {STOCK_FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              className={`inv-filter-chip${filter === f.value ? ' inv-filter-chip--active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button type="button" className="adm-btn adm-btn--primary inv-add-item-btn" onClick={onAdd}>
          + Add Inventory Item
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="inv-empty-hint">
          {items.length === 0 ? 'No items here yet.' : 'No items match your search/filter.'}
          {items.length === 0 && seedCandidates.length > 0 && (
            <>
              {' '}
              <button type="button" className="adm-btn adm-btn--ghost" disabled={seeding} onClick={onSeed}>
                {seeding ? 'Seeding…' : `Seed from Ingredients (${seedCandidates.length})`}
              </button>
            </>
          )}
        </p>
      ) : (
        <div className="inv-grid">
          {filtered.map(item => (
            <ItemCard key={item.id} item={item} Icon={Icon} onEdit={onEdit} onDelete={onDelete} onWaste={onWaste} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Shared form fields for Add/Edit ─────────────────────────────────────── */
function ItemFormFields({ form, set, showCategory }) {
  return (
    <>
      {showCategory && (
        <div className="adm-form-row">
          <label className="adm-form-label">Inventory Category</label>
          <select className="adm-select adm-input" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      <div className="adm-form-2col">
        <div className="adm-form-row">
          <label className="adm-form-label">Current Stock *</label>
          <input className="adm-input" type="number" step="0.01" min="0" value={form.currentStock} onChange={e => set('currentStock', e.target.value)} />
        </div>
        <div className="adm-form-row">
          <label className="adm-form-label">Minimum Stock *</label>
          <input className="adm-input" type="number" step="0.01" min="0" value={form.minimumStock} onChange={e => set('minimumStock', e.target.value)} />
        </div>
      </div>

      <div className="adm-form-2col">
        <div className="adm-form-row">
          <label className="adm-form-label">Maximum Capacity *</label>
          <input className="adm-input" type="number" step="0.01" min="0" value={form.maximumStock} onChange={e => set('maximumStock', e.target.value)} />
        </div>
        <div className="adm-form-row">
          <label className="adm-form-label">Unit *</label>
          <select className="adm-select adm-input" value={form.unit} onChange={e => set('unit', e.target.value)}>
            {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>

      <div className="adm-form-row">
        <label className="adm-form-label">Purchase Price (€)</label>
        <input className="adm-input" type="number" step="0.01" min="0" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} placeholder="0.00" />
      </div>

      <div className="adm-form-row">
        <label className="adm-form-label">Supplier</label>
        <input className="adm-input" value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="e.g. Metro Foods" />
      </div>

      <div className="adm-form-2col">
        <div className="adm-form-row">
          <label className="adm-form-label">Purchase Date</label>
          <input className="adm-input" type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
        </div>
        <div className="adm-form-row">
          <label className="adm-form-label">Expiration Date</label>
          <input className="adm-input" type="date" value={form.expirationDate} onChange={e => set('expirationDate', e.target.value)} />
        </div>
      </div>

      <div className="adm-form-row">
        <label className="adm-form-label">Notes</label>
        <input className="adm-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
      </div>
    </>
  );
}

/* ── Edit dialog — centered glassmorphism popup, fade+scale in/out ── */
function EditItemModal({ item, onSave, onClose }) {
  const Icon = getCategoryIcon(item.category);
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category:       item.category,
    currentStock:   String(item.currentStock),
    minimumStock:   String(item.minimumStock),
    maximumStock:   String(item.maximumStock),
    unit:           item.unit,
    purchasePrice:  item.purchasePrice != null ? String(item.purchasePrice) : '',
    supplier:       item.supplier ?? '',
    purchaseDate:   item.purchaseDate ?? '',
    expirationDate: item.expirationDate ?? '',
    notes:          item.notes ?? '',
  });
  const [err, setErr] = useState('');

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function requestClose() {
    setClosing(true);
    setTimeout(onClose, CLOSE_ANIM_MS);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const stock = parseFloat(form.currentStock);
    if (isNaN(stock) || stock < 0) { setErr('Enter a valid current stock.'); return; }
    const minStock = parseFloat(form.minimumStock);
    if (isNaN(minStock) || minStock < 0) { setErr('Enter a valid minimum stock.'); return; }
    const maxStock = parseFloat(form.maximumStock);
    if (isNaN(maxStock) || maxStock <= 0) { setErr('Enter a valid maximum capacity.'); return; }

    setSaving(true);
    setErr('');
    try {
      await onSave(item.id, {
        category: form.category,
        currentStock: stock,
        minimumStock: minStock,
        maximumStock: maxStock,
        unit: form.unit,
        purchasePrice: form.purchasePrice === '' ? null : parseFloat(form.purchasePrice),
        supplier: form.supplier.trim() || null,
        purchaseDate: form.purchaseDate || null,
        expirationDate: form.expirationDate || null,
        notes: form.notes.trim() || null,
      }, item.currentStock);
      requestClose();
    } catch (e2) {
      setErr(e2.message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Inventory Item" onClose={requestClose} closing={closing} cardClassName="inv-modal-card">
      <form className="adm-modal-body adm-form" onSubmit={handleSubmit}>
        <div className="inv-edit-header">
          <div className="inv-edit-header-image">
            {item.image ? <img src={item.image} alt={item.name} /> : <Icon />}
          </div>
          <div className="inv-edit-header-name">{item.name}</div>
        </div>

        <ItemFormFields form={form} set={set} showCategory />
        {err && <div style={{ color: 'var(--adm-danger, #e03d3d)', fontSize: 13 }}>{err}</div>}
        <div className="adm-modal-footer">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={requestClose} disabled={saving}>Cancel</button>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Add Inventory Item dialog — category locked to the section clicked ── */
function AddItemModal({ category, onSave, onClose }) {
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [form, setForm] = useState({
    currentStock: '', minimumStock: '', maximumStock: '', unit: 'pcs',
    purchasePrice: '', supplier: '', purchaseDate: '', expirationDate: '', notes: '',
  });
  const [err, setErr] = useState('');

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function requestClose() {
    setClosing(true);
    setTimeout(onClose, CLOSE_ANIM_MS);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setErr('Name is required.'); return; }
    const stock = parseFloat(form.currentStock);
    if (isNaN(stock) || stock < 0) { setErr('Enter a valid current stock.'); return; }
    const minStock = parseFloat(form.minimumStock);
    if (isNaN(minStock) || minStock < 0) { setErr('Enter a valid minimum stock.'); return; }
    const maxStock = parseFloat(form.maximumStock);
    if (isNaN(maxStock) || maxStock <= 0) { setErr('Enter a valid maximum capacity.'); return; }

    setSaving(true);
    setErr('');
    try {
      await onSave({
        name: name.trim(),
        image: null,
        category,
        currentStock: stock,
        minimumStock: minStock,
        maximumStock: maxStock,
        unit: form.unit,
        purchasePrice: form.purchasePrice === '' ? null : parseFloat(form.purchasePrice),
        supplier: form.supplier.trim() || null,
        purchaseDate: form.purchaseDate || null,
        expirationDate: form.expirationDate || null,
        notes: form.notes.trim() || null,
      });
      requestClose();
    } catch (e2) {
      setErr(e2.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={`Add Inventory Item — ${category}`} onClose={requestClose} closing={closing} cardClassName="inv-modal-card">
      <form className="adm-modal-body adm-form" onSubmit={handleSubmit}>
        <div className="adm-form-row">
          <label className="adm-form-label">Name *</label>
          <input className="adm-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Coca-Cola" autoFocus />
        </div>
        <ItemFormFields form={{ ...form, category }} set={set} showCategory={false} />
        {err && <div style={{ color: 'var(--adm-danger, #e03d3d)', fontSize: 13 }}>{err}</div>}
        <div className="adm-modal-footer">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={requestClose} disabled={saving}>Cancel</button>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Record Waste — relative amount wasted, logged as its own ledger reason ── */
function WasteModal({ item, onConfirm, onClose }) {
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  function requestClose() {
    setClosing(true);
    setTimeout(onClose, CLOSE_ANIM_MS);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setErr('Enter a valid amount.'); return; }
    setSaving(true);
    setErr('');
    try {
      await onConfirm(item.id, amt, note.trim() || null);
      requestClose();
    } catch (e2) {
      setErr(e2.message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Record Waste" onClose={requestClose} closing={closing} cardClassName="inv-modal-card" size="sm">
      <form className="adm-modal-body adm-form" onSubmit={handleSubmit}>
        <p style={{ margin: '0 0 4px', fontSize: 14 }}>
          Record wasted <strong>{item.name}</strong> (currently {fmtQty(item.currentStock, item.unit)}).
        </p>
        <div className="adm-form-row">
          <label className="adm-form-label">Amount Wasted ({UNIT_LABELS[item.unit]}) *</label>
          <input className="adm-input" type="number" step="0.01" min="0" autoFocus value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="adm-form-row">
          <label className="adm-form-label">Reason / Notes</label>
          <input className="adm-input" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Spoiled, dropped, expired" />
        </div>
        {err && <div style={{ color: 'var(--adm-danger, #e03d3d)', fontSize: 13 }}>{err}</div>}
        <div className="adm-modal-footer">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={requestClose} disabled={saving}>Cancel</button>
          <button type="submit" className="adm-btn adm-btn--danger" disabled={saving}>{saving ? 'Saving…' : 'Record Waste'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Delete confirmation — requires the Inventory module's admin PIN.
   This check is local to Inventory only; it does not touch StaffLockContext
   or any other admin-wide auth, and it's a soft UI gate (the PIN lives in
   this bundle) rather than a real access-control boundary. Confirming
   archives the item (is_active = false) rather than hard-deleting it, so
   its inventory_transactions history is never lost. ── */
function DeleteConfirmModal({ item, onConfirm, onClose }) {
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  function requestClose() {
    setClosing(true);
    setTimeout(onClose, CLOSE_ANIM_MS);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (pin !== INVENTORY_DELETE_PIN) {
      setErr('Incorrect PIN');
      return;
    }
    setSaving(true);
    try {
      await onConfirm(item.id);
      requestClose();
    } catch (e2) {
      setErr(e2.message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Delete Inventory Item" onClose={requestClose} closing={closing} cardClassName="inv-modal-card" size="sm">
      <form className="adm-modal-body adm-form" onSubmit={handleSubmit}>
        <p style={{ margin: '0 0 4px', fontSize: 14 }}>
          Archive <strong>{item.name}</strong>? It's removed from Inventory, but its stock history is
          kept permanently. Enter the admin PIN to confirm.
        </p>
        <div className="adm-form-row">
          <label className="adm-form-label">Admin PIN</label>
          <input
            className="adm-input"
            type="password"
            inputMode="numeric"
            maxLength={4}
            autoFocus
            value={pin}
            onChange={e => { setPin(e.target.value); setErr(''); }}
          />
        </div>
        {err && <div style={{ color: 'var(--adm-danger, #e03d3d)', fontSize: 13 }}>{err}</div>}
        <div className="adm-modal-footer">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={requestClose} disabled={saving}>Cancel</button>
          <button type="submit" className="adm-btn adm-btn--danger" disabled={saving}>{saving ? 'Archiving…' : 'Delete'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Consumption Mapping — link real pizza/burger ingredients to inventory
   items so automatic order-consumption (migration 021 trigger) and the
   Analytics ingredient-consumption/cost/profit metrics have data to compute
   from. Minimal by design: one row per ingredient, picker + amount + unit. ── */
function ConsumptionMappingRow({ ingredient, items, rule, onSave }) {
  const [itemId, setItemId] = useState(rule?.inventory_item_id ?? '');
  const [amount, setAmount] = useState(rule ? String(rule.consumption_amount) : '');
  const [unit, setUnit]     = useState(rule?.consumption_unit ?? 'g');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function handleSave() {
    const amt = parseFloat(amount);
    if (!itemId || isNaN(amt) || amt <= 0) return;
    setSaving(true);
    try {
      await onSave({ ingredient_id: ingredient.id, inventory_item_id: itemId, consumption_amount: amt, consumption_unit: unit });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inv-mapping-row">
      <span className="inv-mapping-name">{ingredient.name}</span>
      <select className="adm-select adm-input" value={itemId} onChange={e => setItemId(e.target.value)}>
        <option value="">— Not linked —</option>
        {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.category})</option>)}
      </select>
      <input className="adm-input" type="number" step="0.01" min="0" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
      <select className="adm-select adm-input" value={unit} onChange={e => setUnit(e.target.value)}>
        {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
      </select>
      <button type="button" className="adm-btn adm-btn--ghost" disabled={saving} onClick={handleSave}>
        {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function ConsumptionMapping({ items, onBack }) {
  const { pizzaList, burgerList } = useAllIngredients();
  const [rules, setRules] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConsumptionRules().then(setRules).catch(e => setError(e.message));
  }, []);

  const ingredients = useMemo(() => {
    const byId = new Map();
    [...pizzaList, ...burgerList].forEach(ing => { if (!byId.has(ing.id)) byId.set(ing.id, ing); });
    return [...byId.values()];
  }, [pizzaList, burgerList]);

  const ruleByIngredient = useMemo(() => {
    const map = {};
    (rules ?? []).forEach(r => { map[r.ingredient_id] = r; });
    return map;
  }, [rules]);

  async function handleSaveRule(rule) {
    const saved = await upsertConsumptionRule(rule);
    setRules(prev => [...(prev ?? []).filter(r => r.ingredient_id !== rule.ingredient_id), saved]);
  }

  return (
    <section className="inv-detail" style={{ '--inv-accent': '250,204,21' }}>
      <button type="button" className="adm-btn adm-btn--ghost inv-back-btn" onClick={onBack}>← Categories</button>
      <div className="inv-detail-header">
        <h3 className="inv-detail-title">Consumption Mapping</h3>
        <span className="inv-detail-count">{ingredients.length} ingredients</span>
      </div>
      <p className="adm-page-subtitle" style={{ margin: '0 0 16px' }}>
        Link each ingredient to how much of an inventory item it consumes per use —
        this powers automatic stock deduction on orders and Ingredient
        Consumption/Cost/Profit analytics.
      </p>
      {error && <div style={{ color: 'var(--adm-danger, #e03d3d)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {rules === null ? (
        <p className="inv-empty-hint">Loading…</p>
      ) : (
        <div className="inv-mapping-list">
          {ingredients.map(ing => (
            <ConsumptionMappingRow
              key={ing.id}
              ingredient={ing}
              items={items}
              rule={ruleByIngredient[ing.id]}
              onSave={handleSaveRule}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function InventoryPage() {
  const { pizzaList, burgerList, pizzaImages, burgerImages } = useAllIngredients();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showMapping, setShowMapping] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [wastingItem, setWastingItem] = useState(null);
  const [addingToCategory, setAddingToCategory] = useState(null);

  const categoryIdByName = useMemo(() => Object.fromEntries(categories.map(c => [c.name, c.id])), [categories]);
  const categoryNameById = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.name])), [categories]);

  async function load() {
    setLoading(true); setLoadError(null);
    try {
      const [cats, rows] = await Promise.all([fetchInventoryCategories(), fetchInventoryItems()]);
      setCategories(cats);
      const nameById = Object.fromEntries(cats.map(c => [c.id, c.name]));
      setItems(rows.map(r => rowToItem(r, nameById)));
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const itemsByCategory = useMemo(() => {
    return items.reduce((acc, item) => {
      (acc[item.category] ??= []).push(item);
      return acc;
    }, {});
  }, [items]);

  // Real ingredients not yet represented by any inventory item, grouped by
  // the Inventory category they'd land in — backs the "Seed from
  // Ingredients" affordance shown on an empty category.
  const seedCandidatesByCategory = useMemo(() => {
    const existingNames = new Set(items.map(i => i.name.toLowerCase()));
    const byId = new Map();
    [...pizzaList, ...burgerList].forEach(ing => {
      if (byId.has(ing.id) || existingNames.has(ing.name.toLowerCase())) return;
      byId.set(ing.id, ing);
    });
    const grouped = {};
    [...byId.values()].forEach(ing => {
      const cat = initialInventoryCategory(ing.category);
      const image = pizzaImages[ing.id] || burgerImages[ing.id];
      (grouped[cat] ??= []).push({ ...ing, image });
    });
    return grouped;
  }, [items, pizzaList, burgerList, pizzaImages, burgerImages]);

  async function handleSaveItem(id, changes, previousCurrentStock) {
    if (changes.currentStock !== previousCurrentStock) {
      await setInventoryStock(id, changes.currentStock);
    }
    const row = await updateInventoryItem(id, formToRow(changes, categoryIdByName));
    setItems(prev => prev.map(i => (i.id === id ? rowToItem({ ...row, current_stock: changes.currentStock }, categoryNameById) : i)));
  }

  async function handleAddItem(newItem) {
    const row = await createInventoryItem({
      name: newItem.name,
      category_id: categoryIdByName[newItem.category],
      unit: newItem.unit,
      current_stock: newItem.currentStock,
      minimum_stock: newItem.minimumStock,
      maximum_stock: newItem.maximumStock,
      purchase_price: newItem.purchasePrice,
      supplier: newItem.supplier,
      last_purchase_date: newItem.purchaseDate,
      expiration_date: newItem.expirationDate,
      notes: newItem.notes,
      image_url: newItem.image,
    });
    setItems(prev => [...prev, rowToItem(row, categoryNameById)]);
  }

  async function handleDeleteItem(id) {
    await archiveInventoryItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function handleWasteItem(id, amount, note) {
    await recordInventoryWaste(id, amount, note);
    setItems(prev => prev.map(i => (i.id === id ? { ...i, currentStock: Math.max(i.currentStock - amount, 0) } : i)));
  }

  async function handleSeedCategory(category) {
    setSeeding(true);
    try {
      const candidates = seedCandidatesByCategory[category] ?? [];
      const created = [];
      for (const ing of candidates) {
        const unit = initialUnit(ing.category);
        const stock = initialStock(unit);
        const row = await createInventoryItem({
          name: ing.name,
          category_id: categoryIdByName[category],
          unit,
          current_stock: stock,
          minimum_stock: Math.round(stock * 0.2),
          maximum_stock: stock,
          image_url: ing.image ?? null,
        });
        created.push(rowToItem(row, categoryNameById));
      }
      setItems(prev => [...prev, ...created]);
    } finally {
      setSeeding(false);
    }
  }

  if (loading) {
    return (
      <div className="inv-page">
        <div className="adm-page-header">
          <h1 className="adm-page-title">Inventory</h1>
        </div>
        <div className="adm-empty"><div className="adm-empty-sub">Loading inventory…</div></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="inv-page">
        <div className="adm-page-header">
          <h1 className="adm-page-title">Inventory</h1>
        </div>
        <div className="adm-empty">
          <div className="adm-empty-title">Couldn't load Inventory</div>
          <div className="adm-empty-sub">{loadError}</div>
          <button type="button" className="adm-btn adm-btn--primary" onClick={load} style={{ marginTop: 12 }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="inv-page">
      <div className="adm-page-header">
        <h1 className="adm-page-title">Inventory</h1>
        <p className="adm-page-subtitle">
          {showMapping
            ? 'Link ingredients to inventory items for automatic stock deduction.'
            : selectedCategory
              ? `${selectedCategory} — browse and edit stock.`
              : 'Choose a category to browse and edit stock.'}
        </p>
        {!selectedCategory && !showMapping && (
          <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowMapping(true)}>
            Consumption Mapping
          </button>
        )}
      </div>

      {showMapping ? (
        <ConsumptionMapping items={items} onBack={() => setShowMapping(false)} />
      ) : selectedCategory ? (
        <CategoryDetail
          key={selectedCategory}
          category={selectedCategory}
          items={itemsByCategory[selectedCategory] ?? []}
          seedCandidates={seedCandidatesByCategory[selectedCategory] ?? []}
          seeding={seeding}
          onBack={() => setSelectedCategory(null)}
          onEdit={setEditingItem}
          onDelete={setDeletingItem}
          onWaste={setWastingItem}
          onAdd={() => setAddingToCategory(selectedCategory)}
          onSeed={() => handleSeedCategory(selectedCategory)}
        />
      ) : (
        <div className="inv-home-grid">
          {CATEGORIES.map(category => (
            <CategoryHomeCard
              key={category}
              category={category}
              count={(itemsByCategory[category] ?? []).length}
              onSelect={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {addingToCategory && (
        <AddItemModal
          category={addingToCategory}
          onSave={handleAddItem}
          onClose={() => setAddingToCategory(null)}
        />
      )}

      {deletingItem && (
        <DeleteConfirmModal
          item={deletingItem}
          onConfirm={handleDeleteItem}
          onClose={() => setDeletingItem(null)}
        />
      )}

      {wastingItem && (
        <WasteModal
          item={wastingItem}
          onConfirm={handleWasteItem}
          onClose={() => setWastingItem(null)}
        />
      )}
    </div>
  );
}
