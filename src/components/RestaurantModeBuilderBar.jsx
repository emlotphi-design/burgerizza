import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRestaurantMode } from '../store/RestaurantModeContext';
import { usePizzaStore } from '../store/PizzaContext';
import { useBurgerStore } from '../features/burger/store/burgerStore';
import { calcBurgerPrice } from '../features/burger/utils/burgerUtils';
import { captureBurgerImage } from '../features/burger/utils/captureBurgerImage';
import { calculatePizzaPrice } from '../utils/pizzaPriceUtils';
import { calcPrice } from '../utils/pizzaUtils';

/* ── Style helpers ───────────────────────────────────────────── */
const WRAP = {
  position:       'fixed',
  bottom:          0,
  left:            0,
  right:           0,
  zIndex:          9990,
  background:     'rgba(22,10,0,0.97)',
  borderTop:      '2px solid #FFD54A',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  fontFamily:     'Nunito, sans-serif',
  boxShadow:      '0 -6px 28px rgba(0,0,0,0.45)',
};

const INNER = {
  display:    'flex',
  alignItems: 'center',
  gap:         12,
  padding:    '10px 20px',
  maxWidth:    960,
  margin:     '0 auto',
};

function mkBtn(bg, color, border = 'none', extra = {}) {
  return {
    height:         44,
    padding:        '0 18px',
    borderRadius:   12,
    border,
    background:     bg,
    color,
    fontFamily:     'Nunito, sans-serif',
    fontSize:       13,
    fontWeight:     900,
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    gap:             7,
    whiteSpace:     'nowrap',
    transition:     'all 0.16s ease',
    flexShrink:      0,
    ...extra,
  };
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   All hooks must be called unconditionally at the top of this
   function — the early return is placed AFTER every hook call.
═══════════════════════════════════════════════════════════════ */
export default function RestaurantModeBuilderBar() {
  /* ── ALL HOOKS FIRST — never conditionally ── */
  const location = useLocation();
  const navigate = useNavigate();

  const { isRestaurantMode } = useRestaurantMode();

  const {
    pizzas = [],
    draft:          pizzaDraft = {},
    saveDraftAsPizza,
    clearDraft:     clearPizzaDraft,
    addBurger,
  } = usePizzaStore() ?? {};

  const {
    draft:      burgerDraft = {},
    clearDraft: clearBurgerDraft,
  } = useBurgerStore() ?? {};

  const [flash,     setFlash]     = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [errMsg,    setErrMsg]    = useState('');

  /* ── Only after all hooks: decide whether to render ── */
  const isPizza  = location.pathname === '/build-pizza';
  const isBurger = location.pathname === '/build-burger';

  if (!isRestaurantMode || (!isPizza && !isBurger)) return null;

  /* ── Derived values (safe with optional chaining) ── */
  const pd = pizzaDraft  ?? {};
  const bd = burgerDraft ?? {};

  const draftPrice = isPizza
    ? (pd.selectedDough
        ? calculatePizzaPrice({
            dough:       pd.selectedDough  ?? 'thin',
            sauce:       pd.selectedSauce  ?? null,
            cheese:      pd.selectedCheese ?? null,
            meats:       Array.isArray(pd.selectedMeats)      ? pd.selectedMeats      : [],
            vegetables:  Array.isArray(pd.selectedVegetables) ? pd.selectedVegetables : [],
          })
        : 0)
    : calcBurgerPrice(bd);

  const cartCount = (Array.isArray(pizzas) ? pizzas : [])
    .reduce((s, p) => s + (p?.quantity || 1), 0);

  const cartTotal = (Array.isArray(pizzas) ? pizzas : [])
    .reduce((s, p) => s + calcPrice(p) * (p?.quantity || 1), 0);

  /* ── Validation ── */
  const pizzaReady  = isPizza  && !!pd.selectedDough && !!pd.selectedSauce && !!pd.selectedCheese;
  const burgerMeats = bd.meats && typeof bd.meats === 'object' && !Array.isArray(bd.meats)
    ? Object.values(bd.meats)
    : [];
  const burgerReady = isBurger && !!bd.bun && burgerMeats.some(q => Number(q) > 0);
  const canAdd      = pizzaReady || burgerReady;

  /* ── Add to Cart — async so we can capture the burger canvas image ── */
  async function handleAdd() {
    if (!canAdd || flash || capturing) return;
    setErrMsg('');

    if (isPizza) {
      if (!pd.selectedDough)  { setErrMsg('Select a dough first');           return; }
      if (!pd.selectedSauce)  { setErrMsg('Select a sauce');                 return; }
      if (!pd.selectedCheese) { setErrMsg('Select a cheese');                return; }

      const ok = saveDraftAsPizza?.();
      if (ok) clearPizzaDraft?.();
      if (!ok) { setErrMsg('Fill dough, sauce and cheese first'); return; }

    } else {
      if (!bd.bun)          { setErrMsg('Select a bun first');    return; }
      if (!burgerMeats.some(q => Number(q) > 0)) {
        setErrMsg('Add at least one meat');
        return;
      }

      // Capture the real composed burger image — same pipeline as ORDER NOW
      setCapturing(true);
      let image = null;
      try {
        image = await captureBurgerImage(bd);
      } catch (_) {
        image = null; // BurgerCartCard bun-preview fallback handles null
      } finally {
        setCapturing(false);
      }

      addBurger?.({ ...bd, image });
      clearBurgerDraft?.();
    }

    setFlash(true);
    setTimeout(() => setFlash(false), 1400);
    setTimeout(() => setErrMsg(''),   3000);
  }

  const priceStr = draftPrice > 0 ? `€${draftPrice.toFixed(2)}` : '—';
  const priceClr = draftPrice > 0 ? '#fff' : 'rgba(255,255,255,0.32)';

  /* ── Add-button style varies by state ── */
  const addBg  = flash ? 'linear-gradient(135deg,#22c55e,#16a34a)'
               : canAdd ? 'linear-gradient(135deg,#FF8C3A,#FF6B1A)'
               : 'rgba(255,255,255,0.09)';
  const addClr = flash ? '#fff' : canAdd ? '#fff' : 'rgba(255,255,255,0.28)';
  const addShadow = flash
    ? '0 4px 18px rgba(34,197,94,0.40)'
    : canAdd ? '0 4px 16px rgba(255,193,7,0.32)' : 'none';

  return (
    <div style={WRAP}>
      <div style={INNER}>

        {/* LEFT — live draft price */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0, minWidth: 72 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,213,74,0.50)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {isPizza ? 'This pizza' : 'This burger'}
          </span>
          <span style={{ fontSize: 16, fontWeight: 900, color: priceClr, letterSpacing: '-0.3px', transition: 'color 0.2s' }}>
            {priceStr}
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,213,74,0.18)', flexShrink: 0, margin: '4px 0' }} />

        {/* Cart summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,213,74,0.50)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            In cart
          </span>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#FFD54A', lineHeight: 1.2 }}>
            {cartCount > 0
              ? `${cartCount} item${cartCount !== 1 ? 's' : ''} · €${cartTotal.toFixed(2)}`
              : 'Empty'}
          </span>
        </div>

        {/* Validation error */}
        {errMsg && (
          <span style={{
            flex: 1, textAlign: 'center',
            fontSize: 11, fontWeight: 700, color: '#f87171',
            background: 'rgba(248,113,113,0.12)',
            padding: '4px 10px', borderRadius: 8,
            border: '1px solid rgba(248,113,113,0.28)',
          }}>
            ⚠ {errMsg}
          </span>
        )}

        {/* Spacer */}
        {!errMsg && <div style={{ flex: 1 }} />}

        {/* Review Order — only when cart has items */}
        {cartCount > 0 && (
          <button
            style={mkBtn('transparent', 'rgba(255,213,74,0.80)', '1.5px solid rgba(255,213,74,0.36)')}
            onClick={() => navigate('/cart')}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,213,74,0.10)'; e.currentTarget.style.color = '#FFD54A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,213,74,0.80)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            Review Order
          </button>
        )}

        {/* Add to Cart */}
        <button
          style={mkBtn(addBg, addClr, 'none', {
            minWidth:    140,
            justifyContent: 'center',
            opacity:     canAdd || flash ? 1 : 0.48,
            cursor:      canAdd && !flash ? 'pointer' : 'default',
            boxShadow:   addShadow,
          })}
          onClick={handleAdd}
          onMouseEnter={e => { if (canAdd && !flash) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
        >
          {flash ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Added!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add to Cart
            </>
          )}
        </button>

      </div>

      {/* Animated progress bar on success */}
      {flash && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, height: 3,
          background: 'linear-gradient(90deg,#22c55e,#4ade80)',
          borderRadius: '0 2px 2px 0',
          animation: 'rmbar-fill 1.4s ease forwards',
        }} />
      )}

      <style>{`
        @keyframes rmbar-fill {
          from { width: 0; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
