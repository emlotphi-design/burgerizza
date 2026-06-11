import { useNavigate } from 'react-router-dom';
import { useRestaurantMode } from '../store/RestaurantModeContext';

const ORDER_TYPES = [
  { id: 'walkin',  label: 'Walk-in',  icon: '🚶' },
  { id: 'pickup',  label: 'Pickup',   icon: '🏃' },
  { id: 'dine_in', label: 'Dine-in',  icon: '🪑' },
];

export default function RestaurantModeBanner() {
  const navigate = useNavigate();
  const { rmConfig, setRmConfig, exitRestaurantMode } = useRestaurantMode();

  function setField(k, v) { setRmConfig(prev => ({ ...prev, [k]: v })); }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 9999,
      background: 'rgba(14,14,14,0.92)',
      color: '#FFD54A',
      fontFamily: 'Nunito, sans-serif',
      borderBottom: '2px solid #FFD54A',
      boxShadow: '0 4px 20px rgba(0,0,0,0.40)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 20px',
        flexWrap: 'wrap',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {/* Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#FFD54A',
          color: 'rgba(255,255,255,0.88)',
          borderRadius: 8,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          🍽️ Restaurant Mode
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,213,74,0.25)', flexShrink: 0 }} />

        {/* Builder shortcuts — open the real website builders */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {[
            { label: '🍔 Burger', path: '/build-burger' },
            { label: '🍕 Pizza',  path: '/build-pizza'  },
            { label: '📋 Menu',   path: '/menu'          },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                padding: '4px 10px',
                borderRadius: 7,
                border: '1.5px solid rgba(255,213,74,0.35)',
                background: 'transparent',
                color: 'rgba(255,213,74,0.80)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 800,
                fontFamily: 'Nunito, sans-serif',
                transition: 'all 0.13s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,213,74,0.12)'; e.currentTarget.style.color = '#FFD54A'; e.currentTarget.style.borderColor = '#FFD54A'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,213,74,0.80)'; e.currentTarget.style.borderColor = 'rgba(255,213,74,0.35)'; }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,213,74,0.25)', flexShrink: 0 }} />

        {/* Order type tabs */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {ORDER_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setField('orderType', t.id)}
              style={{
                padding: '4px 10px',
                borderRadius: 7,
                border: `1.5px solid ${rmConfig.orderType === t.id ? '#FFD54A' : 'rgba(255,213,74,0.25)'}`,
                background: rmConfig.orderType === t.id ? 'rgba(255,213,74,0.16)' : 'transparent',
                color: rmConfig.orderType === t.id ? '#FFD54A' : 'rgba(255,213,74,0.60)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 800,
                fontFamily: 'Nunito, sans-serif',
                transition: 'all 0.13s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Context-sensitive fields */}
        {rmConfig.orderType === 'dine_in' && (
          <input
            value={rmConfig.tableNumber}
            onChange={e => setField('tableNumber', e.target.value)}
            placeholder="Table #"
            style={inputStyle}
          />
        )}
        {(rmConfig.orderType === 'pickup' || rmConfig.orderType === 'walkin') && (
          <input
            value={rmConfig.customerName}
            onChange={e => setField('customerName', e.target.value)}
            placeholder={rmConfig.orderType === 'walkin' ? 'Name (optional)' : 'Customer name'}
            style={inputStyle}
          />
        )}
        {rmConfig.orderType === 'pickup' && (
          <input
            value={rmConfig.phone}
            onChange={e => setField('phone', e.target.value)}
            placeholder="Phone (optional)"
            style={{ ...inputStyle, width: 130 }}
          />
        )}

        {/* Payment */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {[{ id: 'cash', label: '💵 Cash' }, { id: 'card_in_store', label: '💳 Card' }].map(p => (
            <button
              key={p.id}
              onClick={() => setField('payment', p.id)}
              style={{
                padding: '4px 10px',
                borderRadius: 7,
                border: `1.5px solid ${rmConfig.payment === p.id ? '#FFD54A' : 'rgba(255,213,74,0.25)'}`,
                background: rmConfig.payment === p.id ? 'rgba(255,213,74,0.16)' : 'transparent',
                color: rmConfig.payment === p.id ? '#FFD54A' : 'rgba(255,213,74,0.60)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 800,
                fontFamily: 'Nunito, sans-serif',
                transition: 'all 0.13s ease',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Cart shortcut */}
        <button
          onClick={() => navigate('/cart')}
          style={{
            padding: '5px 12px',
            borderRadius: 8,
            border: '1.5px solid rgba(255,213,74,0.35)',
            background: 'transparent',
            color: 'rgba(255,213,74,0.80)',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 800,
            fontFamily: 'Nunito, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.13s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,213,74,0.10)'; e.currentTarget.style.color = '#FFD54A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,213,74,0.80)'; }}
        >
          🛒 View Cart
        </button>

        {/* Exit button */}
        <button
          onClick={() => exitRestaurantMode(navigate)}
          style={{
            padding: '5px 12px',
            borderRadius: 8,
            border: '1.5px solid rgba(220,38,38,0.40)',
            background: 'rgba(220,38,38,0.10)',
            color: '#f87171',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 800,
            fontFamily: 'Nunito, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.13s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.10)'; }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Exit Restaurant Mode
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  height: 28,
  padding: '0 10px',
  borderRadius: 7,
  border: '1.5px solid rgba(255,213,74,0.35)',
  background: 'rgba(255,255,255,0.07)',
  color: '#FFD54A',
  fontSize: 11,
  fontWeight: 700,
  fontFamily: 'Nunito, sans-serif',
  outline: 'none',
  width: 120,
};
