import { useCallback, useRef, useState } from 'react';
import { MENU_ITEMS } from '../../utils/menuData';
import { PIZZA_DOUGHS } from '../../utils/pizzaDoughs';
import { PIZZA_INGREDIENTS, INGREDIENTS_BY_CATEGORY } from '../../utils/pizzaIngredients';
import {
  BURGER_BUNS, BURGER_MEATS, BURGER_CHEESES, BURGER_SAUCES, BURGER_VEGETABLES,
} from '../../features/burger/utils/burgerData';
import { calcBurgerPrice } from '../../features/burger/utils/burgerUtils';
import { calculatePizzaPrice } from '../../utils/pizzaPriceUtils';
import { createOrder } from '../services/adminService';
import '../styles/pos.css';

/* ── Pizza visual-only sets ──────────────────────────────── */
const VISUAL_SAUCE_IDS   = ['bbq','garlic','ketchup','pestos','spicy'];
const VISUAL_CHEESE_IDS  = ['mozzarella','chedar','gouda'];
const VISUAL_MEAT_IDS    = ['pepperoni','salami','bacon','chicken','meatball','beefhum','fleisch','turkeyhum','cheesesausage'];
const VISUAL_VEG_IDS     = ['mushroom','bellpepper','sweetcorn','cherrytomato','redonion','broccoli','eggplant','zucchini','dicedtomato','greenolives','blackolive','babyspinach','bluecheese','pestocheese'];

const PIZZA_SAUCES  = INGREDIENTS_BY_CATEGORY.sauce?.filter(i => VISUAL_SAUCE_IDS.includes(i.id))   ?? [];
const PIZZA_CHEESES = INGREDIENTS_BY_CATEGORY.cheese?.filter(i => VISUAL_CHEESE_IDS.includes(i.id)) ?? [];
const PIZZA_MEATS   = INGREDIENTS_BY_CATEGORY.meat?.filter(i => VISUAL_MEAT_IDS.includes(i.id))     ?? [];
const PIZZA_VEGS    = INGREDIENTS_BY_CATEGORY.vegetable?.filter(i => VISUAL_VEG_IDS.includes(i.id)) ?? [];

/* ── Catalog categories ──────────────────────────────────── */
const CATALOG = [
  { id: 'burger',  label: 'Burgers',  emoji: '🍔', items: MENU_ITEMS.burger,  hasCustom: true  },
  { id: 'pizza',   label: 'Pizzas',   emoji: '🍕', items: MENU_ITEMS.pizza,   hasCustom: true  },
  { id: 'drinks',  label: 'Drinks',   emoji: '🥤', items: MENU_ITEMS.drinks,  hasCustom: false },
  { id: 'dessert', label: 'Desserts', emoji: '🍰', items: MENU_ITEMS.dessert, hasCustom: false },
];

/* ── Kitchen note options ────────────────────────────────── */
const KITCHEN_NOTES = [
  { id: 'spicy',    label: 'Extra spicy',  warn: true  },
  { id: 'no-onion', label: 'No onion',     warn: false },
  { id: 'cheese',   label: 'Extra cheese', warn: false },
  { id: 'allergy',  label: '⚠️ Allergy',   warn: true  },
  { id: 'no-salt',  label: 'No salt',      warn: false },
  { id: 'well-done',label: 'Well done',    warn: false },
];

/* ── Order types & payment ───────────────────────────────── */
const ORDER_TYPES = [
  { id: 'walkin',  label: 'Walk-in',  icon: '🚶' },
  { id: 'pickup',  label: 'Pickup',   icon: '🏃' },
  { id: 'dine_in', label: 'Dine-in',  icon: '🪑' },
];
const PAYMENTS = [
  { id: 'cash', label: 'Cash',           icon: '💵' },
  { id: 'card', label: 'Card in Store',  icon: '💳' },
];

/* ── Helpers ─────────────────────────────────────────────── */
function fmtEur(n) { return '€' + Number(n || 0).toFixed(2); }
function uid()     { return Math.random().toString(36).slice(2, 10); }

function burgerSummary(draft) {
  const parts = [];
  if (draft.bun) parts.push(BURGER_BUNS.find(b => b.id === draft.bun)?.name ?? draft.bun);
  const meats = Object.entries(draft.meats ?? {}).filter(([, q]) => q > 0);
  if (meats.length) parts.push(meats.map(([id, q]) => {
    const name = BURGER_MEATS.find(m => m.id === id)?.name ?? id;
    return q > 1 ? `${name}×${q}` : name;
  }).join(', '));
  return parts.join(' · ') || 'Custom Burger';
}

function pizzaSummary(draft) {
  const doughName = PIZZA_DOUGHS.find(d => d.id === draft.dough)?.name ?? '';
  const sauceName = PIZZA_SAUCES.find(s => s.id === draft.sauce)?.name ?? '';
  return [doughName, sauceName].filter(Boolean).join(' + ') || 'Custom Pizza';
}

/* ═══════════════════════════════════════════════════════════
   BURGER BUILDER
═══════════════════════════════════════════════════════════ */
const EMPTY_BURGER = { bun: null, meats: {}, cheeses: {}, sauces: [], vegetables: [] };

function BurgerBuilder({ draft, onChange, onAdd }) {
  const price = draft.bun ? calcBurgerPrice(draft) : 0;

  function setBun(id)  { onChange({ ...draft, bun: id }); }
  function toggleSauce(id) {
    const s = draft.sauces.includes(id) ? draft.sauces.filter(x => x !== id) : [...draft.sauces, id];
    onChange({ ...draft, sauces: s });
  }
  function toggleVeg(id) {
    const v = draft.vegetables.includes(id) ? draft.vegetables.filter(x => x !== id) : [...draft.vegetables, id];
    onChange({ ...draft, vegetables: v });
  }
  function setMeatQty(id, delta) {
    const cur = draft.meats[id] ?? 0;
    const next = Math.max(0, cur + delta);
    const meats = { ...draft.meats };
    if (next === 0) delete meats[id]; else meats[id] = next;
    onChange({ ...draft, meats });
  }
  function setCheeseQty(id, delta) {
    const cur = draft.cheeses[id] ?? 0;
    const next = Math.max(0, cur + delta);
    const cheeses = { ...draft.cheeses };
    if (next === 0) delete cheeses[id]; else cheeses[id] = next;
    onChange({ ...draft, cheeses });
  }

  return (
    <>
      <div className="pos-builder-body">
        {/* Bun */}
        <div className="pos-bld-section">
          <div className="pos-bld-section-title">
            🍔 Bun <span className="pos-bld-required">(required)</span>
          </div>
          <div className="pos-bld-grid">
            {BURGER_BUNS.map(b => (
              <button
                key={b.id}
                className={`pos-ing-chip${draft.bun === b.id ? ' pos-ing-chip--sel' : ''}`}
                onClick={() => setBun(b.id)}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, display: 'inline-block', marginBottom: 2 }} />
                <span className="pos-ing-name">{b.name}</span>
                <span className="pos-ing-price">{fmtEur(b.price)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Meats */}
        <div className="pos-bld-section">
          <div className="pos-bld-section-title">🥩 Meat</div>
          <div className="pos-bld-grid">
            {BURGER_MEATS.map(m => {
              const qty = draft.meats[m.id] ?? 0;
              return (
                <div
                  key={m.id}
                  className={`pos-ing-chip${qty > 0 ? ' pos-ing-chip--sel' : ''}`}
                  style={{ cursor: 'default' }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, display: 'inline-block', marginBottom: 2 }} />
                  <span className="pos-ing-name">{m.name}</span>
                  <span className="pos-ing-price">{fmtEur(m.price)}</span>
                  <div className="pos-ing-qty">
                    <button className="pos-ing-qty-btn" onClick={() => setMeatQty(m.id, -1)} disabled={qty === 0}>−</button>
                    <span className="pos-ing-qty-num">{qty}</span>
                    <button className="pos-ing-qty-btn" onClick={() => setMeatQty(m.id, +1)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cheeses */}
        <div className="pos-bld-section">
          <div className="pos-bld-section-title">🧀 Cheese</div>
          <div className="pos-bld-grid">
            {BURGER_CHEESES.map(c => {
              const qty = draft.cheeses[c.id] ?? 0;
              return (
                <div
                  key={c.id}
                  className={`pos-ing-chip${qty > 0 ? ' pos-ing-chip--sel' : ''}`}
                  style={{ cursor: 'default' }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, display: 'inline-block', marginBottom: 2 }} />
                  <span className="pos-ing-name">{c.name}</span>
                  <span className="pos-ing-price">{fmtEur(c.price)}</span>
                  <div className="pos-ing-qty">
                    <button className="pos-ing-qty-btn" onClick={() => setCheeseQty(c.id, -1)} disabled={qty === 0}>−</button>
                    <span className="pos-ing-qty-num">{qty}</span>
                    <button className="pos-ing-qty-btn" onClick={() => setCheeseQty(c.id, +1)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sauces */}
        <div className="pos-bld-section">
          <div className="pos-bld-section-title">🥫 Sauces</div>
          <div className="pos-bld-grid--wide pos-bld-grid">
            {BURGER_SAUCES.map(s => (
              <button
                key={s.id}
                className={`pos-ing-chip${draft.sauces.includes(s.id) ? ' pos-ing-chip--sel' : ''}`}
                onClick={() => toggleSauce(s.id)}
              >
                <span className="pos-ing-name">{s.name}</span>
                <span className="pos-ing-price">{fmtEur(s.price)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Vegetables */}
        <div className="pos-bld-section">
          <div className="pos-bld-section-title">🥬 Vegetables</div>
          <div className="pos-bld-grid--wide pos-bld-grid">
            {BURGER_VEGETABLES.map(v => (
              <button
                key={v.id}
                className={`pos-ing-chip${draft.vegetables.includes(v.id) ? ' pos-ing-chip--sel' : ''}`}
                onClick={() => toggleVeg(v.id)}
              >
                <span className="pos-ing-name">{v.name}</span>
                <span className="pos-ing-price">{fmtEur(v.price)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pos-builder-footer">
        <div className="pos-builder-price">
          <div className="pos-builder-price-label">Burger total</div>
          <div className="pos-builder-price-val">{fmtEur(price)}</div>
        </div>
        <button
          className="adm-btn adm-btn--primary"
          onClick={() => onAdd(draft, price)}
          disabled={!draft.bun}
          style={{ height: 40, fontSize: 13 }}
        >
          Add to Order
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   PIZZA BUILDER
═══════════════════════════════════════════════════════════ */
const EMPTY_PIZZA = { dough: null, sauce: null, cheese: null, meats: [], vegetables: [] };

function PizzaBuilder({ draft, onChange, onAdd }) {
  const price = draft.dough ? calculatePizzaPrice(draft) : 0;

  function toggleMeat(id) {
    const m = draft.meats.includes(id) ? draft.meats.filter(x => x !== id) : [...draft.meats, id];
    onChange({ ...draft, meats: m });
  }
  function toggleVeg(id) {
    const v = draft.vegetables.includes(id) ? draft.vegetables.filter(x => x !== id) : [...draft.vegetables, id];
    onChange({ ...draft, vegetables: v });
  }

  return (
    <>
      <div className="pos-builder-body">
        {/* Dough */}
        <div className="pos-bld-section">
          <div className="pos-bld-section-title">
            🫓 Dough / Base <span className="pos-bld-required">(required)</span>
          </div>
          <div className="pos-bld-grid">
            {PIZZA_DOUGHS.map(d => (
              <button
                key={d.id}
                className={`pos-ing-chip${draft.dough === d.id ? ' pos-ing-chip--sel' : ''}`}
                onClick={() => onChange({ ...draft, dough: d.id })}
              >
                <span className="pos-ing-name">{d.name}</span>
                <span className="pos-ing-price">{fmtEur(d.price)}</span>
                <div className="pos-ing-tags">
                  <span className="pos-ing-tag">{d.type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sauce */}
        <div className="pos-bld-section">
          <div className="pos-bld-section-title">🥫 Sauce</div>
          <div className="pos-bld-grid">
            {PIZZA_SAUCES.map(s => (
              <button
                key={s.id}
                className={`pos-ing-chip${draft.sauce === s.id ? ' pos-ing-chip--sel' : ''}`}
                onClick={() => onChange({ ...draft, sauce: draft.sauce === s.id ? null : s.id })}
              >
                <span className="pos-ing-name">{s.name}</span>
                <span className="pos-ing-price">{fmtEur(s.price)}</span>
                {s.isSpicy && <div className="pos-ing-tags"><span className="pos-ing-tag">🌶️</span></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Cheese */}
        <div className="pos-bld-section">
          <div className="pos-bld-section-title">🧀 Cheese</div>
          <div className="pos-bld-grid">
            {PIZZA_CHEESES.map(c => (
              <button
                key={c.id}
                className={`pos-ing-chip${draft.cheese === c.id ? ' pos-ing-chip--sel' : ''}`}
                onClick={() => onChange({ ...draft, cheese: draft.cheese === c.id ? null : c.id })}
              >
                <span className="pos-ing-name">{c.name}</span>
                <span className="pos-ing-price">{fmtEur(c.price)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Meats */}
        <div className="pos-bld-section">
          <div className="pos-bld-section-title">🥩 Meats (multi-select)</div>
          <div className="pos-bld-grid--wide pos-bld-grid">
            {PIZZA_MEATS.map(m => (
              <button
                key={m.id}
                className={`pos-ing-chip${draft.meats.includes(m.id) ? ' pos-ing-chip--sel' : ''}`}
                onClick={() => toggleMeat(m.id)}
              >
                <span className="pos-ing-name">{m.name}</span>
                <span className="pos-ing-price">{fmtEur(m.price)}</span>
                {m.isSpicy && <div className="pos-ing-tags"><span className="pos-ing-tag">🌶️</span></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Vegetables */}
        <div className="pos-bld-section">
          <div className="pos-bld-section-title">🥬 Vegetables (multi-select)</div>
          <div className="pos-bld-grid--wide pos-bld-grid">
            {PIZZA_VEGS.map(v => (
              <button
                key={v.id}
                className={`pos-ing-chip${draft.vegetables.includes(v.id) ? ' pos-ing-chip--sel' : ''}`}
                onClick={() => toggleVeg(v.id)}
              >
                <span className="pos-ing-name">{v.name}</span>
                <span className="pos-ing-price">{fmtEur(v.price)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pos-builder-footer">
        <div className="pos-builder-price">
          <div className="pos-builder-price-label">Pizza total</div>
          <div className="pos-builder-price-val">{fmtEur(price)}</div>
        </div>
        <button
          className="adm-btn adm-btn--primary"
          onClick={() => onAdd(draft, price)}
          disabled={!draft.dough}
          style={{ height: 40, fontSize: 13 }}
        >
          Add to Order
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   POS PAGE
═══════════════════════════════════════════════════════════ */
export default function POS() {
  /* ── Catalog ── */
  const [activeCat, setActiveCat] = useState('burger');

  /* ── Cart ── */
  const [cart,         setCart]         = useState([]);
  const [kitchenNotes, setKitchenNotes] = useState(new Set());

  /* ── Builder modal ── */
  const [builderType,  setBuilderType]  = useState(null); // 'burger' | 'pizza' | null
  const [burgerDraft,  setBurgerDraft]  = useState(EMPTY_BURGER);
  const [pizzaDraft,   setPizzaDraft]   = useState(EMPTY_PIZZA);

  /* ── Checkout ── */
  const [orderType, setOrderType] = useState('walkin');
  const [payment,   setPayment]   = useState('cash');
  const [customer,  setCustomer]  = useState({ name: '', phone: '', tableNumber: '' });

  /* ── UI ── */
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toasts,  setToasts]  = useState([]);
  const successRef = useRef(null);

  /* ── Computed totals ── */
  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);
  const prepMins  = 8 + cart.length * 2 + (orderType === 'dine_in' ? 0 : 5);

  /* ── Toast ── */
  function addToast(title, sub, type = 'ok', icon = '✅') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, sub, type, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  }

  /* ── Cart helpers ── */
  function addMenuItemToCart(item) {
    setCart(prev => {
      const found = prev.find(c => c.catalogId === item.id && c.type === 'menu');
      if (found) return prev.map(c => c.catalogId === item.id && c.type === 'menu' ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, {
        _key: uid(), type: 'menu', catalogId: item.id,
        name: item.name, emoji: item.emoji, price: item.price, qty: 1, note: '',
      }];
    });
  }

  function addCustomBurgerToCart(draft, price) {
    const name = burgerSummary(draft) || 'Custom Burger';
    setCart(prev => [...prev, {
      _key: uid(), type: 'burger', catalogId: 'custom-burger',
      name, emoji: '🍔', price, qty: 1, note: '',
      customization: { ...draft },
    }]);
    setBuilderType(null);
    setBurgerDraft(EMPTY_BURGER);
  }

  function addCustomPizzaToCart(draft, price) {
    const name = pizzaSummary(draft) || 'Custom Pizza';
    setCart(prev => [...prev, {
      _key: uid(), type: 'pizza', catalogId: 'custom-pizza',
      name, emoji: '🍕', price, qty: 1, note: '',
      customization: { ...draft },
    }]);
    setBuilderType(null);
    setPizzaDraft(EMPTY_PIZZA);
  }

  function changeQty(key, delta) {
    setCart(prev =>
      prev.map(c => c._key === key ? { ...c, qty: Math.max(0, c.qty + delta) } : c)
          .filter(c => c.qty > 0)
    );
  }
  function removeItem(key)        { setCart(prev => prev.filter(c => c._key !== key)); }
  function setItemNote(key, note) { setCart(prev => prev.map(c => c._key === key ? { ...c, note } : c)); }
  function clearCart()            { setCart([]); setKitchenNotes(new Set()); }

  function toggleNote(id) {
    setKitchenNotes(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function setField(field, val) { setCustomer(prev => ({ ...prev, [field]: val })); }

  /* ── Send to Kitchen ── */
  const handleSend = useCallback(async () => {
    if (!cart.length) {
      addToast('Cart is empty', 'Add items first', 'error', '❌');
      return;
    }

    const notes = [...kitchenNotes].map(id => KITCHEN_NOTES.find(n => n.id === id)?.label).filter(Boolean).join(', ');

    const customerName =
      orderType === 'dine_in'
        ? (customer.name.trim() || `Table ${customer.tableNumber || '?'}`)
        : (customer.name.trim() || 'Walk-in');

    const items = cart.map(c => {
      const base = {
        id:       c.catalogId,
        name:     c.name,
        emoji:    c.emoji,
        price:    c.price,
        quantity: c.qty,
        type:     c.type,
        note:     c.note || undefined,
      };
      if (c.type === 'burger' && c.customization) {
        return {
          ...base,
          bun:          c.customization.bun,
          burger_meats: c.customization.meats,
          cheeses:      c.customization.cheeses,
          sauces:       c.customization.sauces,
          vegetables:   c.customization.vegetables,
        };
      }
      if (c.type === 'pizza' && c.customization) {
        return {
          ...base,
          dough:      c.customization.dough,
          sauce:      c.customization.sauce,
          cheese:     c.customization.cheese,
          meats:      c.customization.meats,
          vegetables: c.customization.vegetables,
        };
      }
      return base;
    });

    const payload = {
      customer_name:    customerName,
      customer_phone:   customer.phone.trim() || null,
      customer_email:   null,
      delivery_address: {
        mode:        orderType,
        tableNumber: orderType === 'dine_in' ? (customer.tableNumber || null) : undefined,
      },
      items,
      total_price:    +subtotal.toFixed(2),
      payment_method: payment,
      order_type:     orderType,
      kitchen_notes:  notes || null,
      status:         'preparing',   // POS orders go straight to kitchen
      source:         'pos',
    };

    setSending(true);
    try {
      await createOrder(payload);

      /* Audio ding */
      try {
        const ctx = new window.AudioContext();
        [[880, 0], [1100, 0.13], [1320, 0.26]].forEach(([hz, delay]) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = hz; o.type = 'sine';
          g.gain.setValueAtTime(0.16, ctx.currentTime + delay);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
          o.start(ctx.currentTime + delay);
          o.stop(ctx.currentTime + delay + 0.22);
        });
      } catch (_) {}

      setSuccess(true);
      clearCart();
      setCustomer({ name: '', phone: '', tableNumber: '' });

      clearTimeout(successRef.current);
      successRef.current = setTimeout(() => {
        setSuccess(false);
        addToast('Order sent to kitchen!', 'Now visible in Orders dashboard', 'ok', '🛎️');
      }, 2100);
    } catch (err) {
      addToast('Failed to send', err?.message || 'Please try again', 'error', '❌');
    } finally {
      setSending(false);
    }
  }, [cart, customer, kitchenNotes, orderType, payment, subtotal]);

  const currentCat = CATALOG.find(c => c.id === activeCat);

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div>
      {/* ── Toasts ── */}
      <div className="adm-toast-wrap">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`adm-toast${t.type === 'error' ? ' adm-toast--error' : ' adm-toast--new-order'}`}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 1 }}>{t.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--adm-text-2)', fontWeight: 700 }}>{t.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Page header ── */}
      <div className="adm-page-header">
        <div className="adm-page-header-left">
          <h1 className="adm-page-title">
            POS — Walk-In
            <span className="pos-live">
              <span className="pos-live-dot" /> Live
            </span>
          </h1>
          <p className="adm-page-subtitle">
            In-store cashier · full menu &amp; custom builds · orders go straight to kitchen
          </p>
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--adm-text-3)', fontFamily: 'Nunito, sans-serif', textAlign: 'right' }}>
          {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''} · ${fmtEur(subtotal)}` : 'Cart empty'}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          3-PANEL GRID
      ══════════════════════════════════════════════════ */}
      <div className="pos-grid">

        {/* ╔═══════════════════╗
            ║  PANEL 1: MENU    ║
            ╚═══════════════════╝ */}
        <div className="pos-panel pos-panel-catalog">

          <div className="pos-cat-tabs">
            {CATALOG.map(cat => (
              <button
                key={cat.id}
                className={`pos-cat-tab${activeCat === cat.id ? ' pos-cat-tab--active' : ''}`}
                onClick={() => setActiveCat(cat.id)}
              >
                <span className="pos-cat-emoji">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="pos-product-grid">
            {currentCat?.items.map(item => (
              <button
                key={item.id}
                className="pos-product-btn"
                onClick={() => addMenuItemToCart(item)}
              >
                <span className="pos-product-emoji">{item.emoji}</span>
                <span className="pos-product-name">{item.name}</span>
                <span className="pos-product-price">{fmtEur(item.price)}</span>
                <span className="pos-product-add-pip">+</span>
              </button>
            ))}

            {currentCat?.hasCustom && (
              <button
                className="pos-product-btn pos-product-btn--custom"
                onClick={() => {
                  if (activeCat === 'burger') { setBurgerDraft(EMPTY_BURGER); setBuilderType('burger'); }
                  else                        { setPizzaDraft(EMPTY_PIZZA);   setBuilderType('pizza');  }
                }}
              >
                <span className="pos-product-emoji">🔨</span>
                <span className="pos-product-name">Custom Build</span>
                <span className="pos-product-price">Configure →</span>
              </button>
            )}
          </div>
        </div>

        {/* ╔═══════════════════╗
            ║  PANEL 2: CART    ║
            ╚═══════════════════╝ */}
        <div className="pos-panel pos-panel-cart">

          <div className="pos-panel-head">
            <div className="pos-panel-title">
              Order
              {itemCount > 0 && <span className="pos-count-badge">{itemCount}</span>}
            </div>
            {cart.length > 0 && (
              <button
                className="adm-btn adm-btn--danger"
                style={{ height: 28, fontSize: 11, padding: '0 10px', gap: 4 }}
                onClick={clearCart}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                </svg>
                Clear
              </button>
            )}
          </div>

          <div className="pos-cart-body">
            {cart.length === 0 ? (
              <div className="pos-cart-empty">
                <div className="pos-cart-empty-icon">🛒</div>
                <div className="pos-cart-empty-text">Cart is empty</div>
                <div className="pos-cart-empty-sub">Tap items from the menu</div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item._key} className="pos-cart-item">
                  <div className="pos-cart-item-row">
                    <span className="pos-cart-item-emoji">{item.emoji}</span>
                    <div className="pos-cart-item-info">
                      <div className="pos-cart-item-name">{item.name}</div>
                      {item.type === 'burger' && item.customization?.bun && (
                        <div className="pos-cart-item-mods">
                          {burgerSummary(item.customization)}
                        </div>
                      )}
                      {item.type === 'pizza' && item.customization?.dough && (
                        <div className="pos-cart-item-mods">
                          {pizzaSummary(item.customization)}
                        </div>
                      )}
                      <div className="pos-cart-item-unit">{fmtEur(item.price)} each</div>
                    </div>
                    <div className="pos-qty">
                      <button className="pos-qty-btn pos-qty-btn--minus" onClick={() => changeQty(item._key, -1)}>−</button>
                      <span className="pos-qty-num">{item.qty}</span>
                      <button className="pos-qty-btn" onClick={() => changeQty(item._key, +1)}>+</button>
                    </div>
                    <span className="pos-cart-item-subtotal">{fmtEur(item.price * item.qty)}</span>
                    <button className="pos-remove-btn" onClick={() => removeItem(item._key)} title="Remove">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--adm-text-4)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    <input
                      className="adm-input"
                      style={{ height: 26, fontSize: 10.5, padding: '0 9px' }}
                      placeholder="Note for kitchen…"
                      value={item.note}
                      onChange={e => setItemNote(item._key, e.target.value)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pos-kitchen-strip">
            <div className="pos-kitchen-label">Kitchen notes</div>
            <div className="pos-kitchen-chips">
              {KITCHEN_NOTES.map(n => (
                <button
                  key={n.id}
                  className={['pos-kitchen-chip', kitchenNotes.has(n.id) ? 'pos-kitchen-chip--on' : '', n.warn ? 'pos-kitchen-chip--warn' : ''].filter(Boolean).join(' ')}
                  onClick={() => toggleNote(n.id)}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ╔═════════════════════╗
            ║  PANEL 3: CHECKOUT  ║
            ╚═════════════════════╝ */}
        <div className="pos-panel">

          <div className="pos-panel-head">
            <div className="pos-panel-title">Checkout</div>
          </div>

          <div className="pos-checkout-scroll">

            {/* Order type */}
            <div>
              <div className="pos-section-lbl">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Order type
              </div>
              <div className="pos-type-row">
                {ORDER_TYPES.map(t => (
                  <button
                    key={t.id}
                    className={`pos-seg-btn${orderType === t.id ? ' pos-seg-btn--active' : ''}`}
                    onClick={() => setOrderType(t.id)}
                  >
                    <span className="pos-seg-btn-icon">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer fields — adapt by order type */}
            <div>
              <div className="pos-section-lbl">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {orderType === 'dine_in' ? 'Table' : 'Customer'}
              </div>

              {orderType === 'dine_in' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <label className="adm-form-label">Table number</label>
                    <input
                      className="adm-input" style={{ height: 34, marginTop: 3 }}
                      placeholder="e.g. 7"
                      value={customer.tableNumber}
                      onChange={e => setField('tableNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="adm-form-label">Name (optional)</label>
                    <input
                      className="adm-input" style={{ height: 34, marginTop: 3 }}
                      placeholder="Customer name"
                      value={customer.name}
                      onChange={e => setField('name', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {orderType === 'pickup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <label className="adm-form-label">Customer name</label>
                    <input
                      className="adm-input" style={{ height: 34, marginTop: 3 }}
                      placeholder="Ahmed"
                      value={customer.name}
                      onChange={e => setField('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="adm-form-label">Phone (optional)</label>
                    <input
                      className="adm-input" style={{ height: 34, marginTop: 3 }}
                      placeholder="+49 …"
                      value={customer.phone}
                      onChange={e => setField('phone', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {orderType === 'walkin' && (
                <div>
                  <label className="adm-form-label">Name (optional)</label>
                  <input
                    className="adm-input" style={{ height: 34, marginTop: 3 }}
                    placeholder="Walk-in customer"
                    value={customer.name}
                    onChange={e => setField('name', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Payment */}
            <div>
              <div className="pos-section-lbl">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
                Payment
              </div>
              <div className="pos-pay-row">
                {PAYMENTS.map(opt => (
                  <button
                    key={opt.id}
                    className={`pos-seg-btn${payment === opt.id ? ' pos-seg-btn--active' : ''}`}
                    onClick={() => setPayment(opt.id)}
                    style={{ gridColumn: opt.id === 'card' ? 'span 1' : undefined }}
                  >
                    <span className="pos-seg-btn-icon">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div>
              <div className="pos-section-lbl">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                Summary
              </div>
              <div className="pos-summary">
                {cart.map(item => (
                  <div key={item._key} className="pos-summary-row pos-summary-row--item">
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {item.emoji} {item.name}
                      {item.qty > 1 && <span style={{ color: 'var(--adm-text-4)', marginLeft: 3 }}>×{item.qty}</span>}
                    </span>
                    <span className="pos-summary-val" style={{ flexShrink: 0, marginLeft: 8 }}>
                      {fmtEur(item.price * item.qty)}
                    </span>
                  </div>
                ))}
                <div className="pos-summary-row pos-summary-row--total">
                  <span>Total</span>
                  <span className="pos-summary-val pos-summary-val--accent">{fmtEur(subtotal)}</span>
                </div>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="pos-prep">
                <span className="pos-prep-icon">⏱️</span>
                <div>
                  <div className="pos-prep-label">Est. preparation</div>
                  <div className="pos-prep-val">~{prepMins} min</div>
                </div>
              </div>
            )}

          </div>

          {/* Send to Kitchen */}
          <div className="pos-checkout-footer">
            <button
              className={`pos-send-btn${sending ? ' pos-send-btn--sending' : ''}`}
              onClick={handleSend}
              disabled={sending || cart.length === 0}
            >
              {sending ? (
                <>
                  <div className="pos-send-spinner" />
                  Sending…
                </>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Send to Kitchen
                </>
              )}
            </button>
            <div style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: 'var(--adm-text-4)', fontFamily: 'Nunito, sans-serif' }}>
              Status → <strong style={{ color: 'var(--adm-orange)' }}>Preparing</strong> · source: POS
            </div>
          </div>
        </div>

        {/* ── Builder modal overlay ── */}
        {builderType && (
          <div className="pos-builder-overlay" onClick={e => { if (e.target === e.currentTarget) setBuilderType(null); }}>
            <div className="pos-builder-panel">
              <div className="pos-builder-head">
                <div className="pos-builder-title">
                  {builderType === 'burger' ? '🍔 Build a Burger' : '🍕 Build a Pizza'}
                </div>
                <button className="pos-builder-close" onClick={() => setBuilderType(null)}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {builderType === 'burger' && (
                <BurgerBuilder
                  draft={burgerDraft}
                  onChange={setBurgerDraft}
                  onAdd={addCustomBurgerToCart}
                />
              )}
              {builderType === 'pizza' && (
                <PizzaBuilder
                  draft={pizzaDraft}
                  onChange={setPizzaDraft}
                  onAdd={addCustomPizzaToCart}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Success overlay ── */}
        {success && (
          <div className="pos-success-overlay">
            <div className="pos-success-check">✅</div>
            <div className="pos-success-title">Order in Kitchen!</div>
            <div className="pos-success-sub">Status: Preparing · appearing in Orders now</div>
          </div>
        )}
      </div>
    </div>
  );
}
