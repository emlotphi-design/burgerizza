import { useNavigate, useLocation } from 'react-router-dom';
import { usePizzaStore } from '../store/PizzaContext';
import { useRestaurantMode } from '../store/RestaurantModeContext';
import { calcPrice } from '../utils/pizzaUtils';

export default function RestaurantModeCartBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRestaurantMode } = useRestaurantMode();
  const { pizzas } = usePizzaStore();

  // Don't render on cart, checkout, or builders — those have their own CTAs
  const hidden = ['/cart', '/checkout', '/build-burger', '/build-pizza'].includes(location.pathname);
  if (!isRestaurantMode || !pizzas.length || hidden) return null;

  const itemCount  = pizzas.reduce((s, p) => s + (p.quantity || 1), 0);
  const grandTotal = pizzas.reduce((s, p) => s + calcPrice(p) * (p.quantity || 1), 0);

  return (
    <div style={{
      position:   'fixed',
      bottom:     0,
      left:       0,
      right:      0,
      zIndex:     8888,
      background: 'rgba(14,14,14,0.97)',
      borderTop:  '2px solid #FFD54A',
      backdropFilter: 'blur(12px)',
      fontFamily: 'Nunito, sans-serif',
    }}>
      <div style={{
        maxWidth:  900,
        margin:    '0 auto',
        padding:   '12px 20px',
        display:   'flex',
        alignItems:'center',
        gap:       16,
      }}>
        {/* Cart summary */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,213,74,0.60)', marginBottom: 1 }}>
            Cart
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#FFD54A' }}>
            {itemCount} item{itemCount !== 1 ? 's' : ''} · €{grandTotal.toFixed(2)}
          </div>
        </div>

        {/* View cart link */}
        <button
          onClick={() => navigate('/cart')}
          style={{
            padding:      '9px 18px',
            borderRadius: 12,
            border:       '1.5px solid rgba(255,213,74,0.40)',
            background:   'transparent',
            color:        'rgba(255,213,74,0.80)',
            fontSize:     12,
            fontWeight:   800,
            cursor:       'pointer',
            fontFamily:   'Nunito, sans-serif',
            whiteSpace:   'nowrap',
            transition:   'all 0.13s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,213,74,0.10)'; e.currentTarget.style.color = '#FFD54A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,213,74,0.80)'; }}
        >
          🛒 Review Order
        </button>

        {/* Send to Kitchen */}
        <button
          onClick={() => navigate('/checkout')}
          style={{
            padding:      '11px 28px',
            borderRadius: 14,
            border:       'none',
            background:   'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color:        '#fff',
            fontSize:     14,
            fontWeight:   900,
            cursor:       'pointer',
            fontFamily:   'Nunito, sans-serif',
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            boxShadow:    '0 4px 16px rgba(22,163,74,0.35)',
            whiteSpace:   'nowrap',
            transition:   'transform 0.14s ease, box-shadow 0.14s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(22,163,74,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,163,74,0.35)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          Place Order · €{grandTotal.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
