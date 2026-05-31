import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { CATEGORIES, MENU_ITEMS } from '../utils/menuData';
import { usePizzaStore } from '../store/PizzaContext';
import { useRestaurantMode } from '../store/RestaurantModeContext';

const BUILDER_ROUTES = { burger: '/build-burger', pizza: '/build-pizza' };

export default function CategoryPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { addToCart } = usePizzaStore();
  const { isRestaurantMode } = useRestaurantMode();

  const [addedIds, setAddedIds] = useState(new Set());

  const category = location.pathname.slice(1); // 'burger' | 'pizza' | 'dessert' | 'drinks'
  const catData  = CATEGORIES.find(c => c.id === category);
  const products = MENU_ITEMS[category] ?? [];

  if (!catData) {
    navigate('/menu');
    return null;
  }

  const handleAddToCart = useCallback((product) => {
    addToCart({
      type:        'menu',
      category,
      name:        product.name,
      description: product.description,
      price:       product.price,
      emoji:       product.emoji,
    });

    // Visual feedback: green "Added" state for 1.5s
    setAddedIds(prev => new Set([...prev, product.id]));
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  }, [addToCart, category]);

  return (
    <div className="cat-page page-enter">
      <Navbar />

      <main className="cat-page-main">

        {/* Hero header */}
        <div className="cat-page-hero">
          <span className="cat-page-emoji" aria-hidden="true">
            {catData.emoji}
          </span>
          <h1 className="cat-page-title">{catData.title}</h1>
          <p className="cat-page-subtitle">{catData.subtitle}</p>
          <button className="cat-page-back" onClick={() => navigate('/menu')}>
            ← Back to Menu
          </button>
        </div>

        {/* Restaurant mode: prominent builder shortcut for burger/pizza */}
        {isRestaurantMode && BUILDER_ROUTES[category] && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '0 0 24px',
          }}>
            <button
              onClick={() => navigate(BUILDER_ROUTES[category])}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 28px',
                borderRadius: 16,
                border: '2.5px solid #FFD54A',
                background: '#FFD54A',
                color: '#1A0A00',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 900,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(255,193,7,0.30)',
                transition: 'transform 0.14s ease, box-shadow 0.14s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(255,193,7,0.40)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,193,7,0.30)'; }}
            >
              {category === 'burger' ? '🍔' : '🍕'}
              Build a Custom {category === 'burger' ? 'Burger' : 'Pizza'} →
            </button>
          </div>
        )}

        {/* Product grid */}
        <div className="menu-products-grid">
          {products.map((product, idx) => {
            const isAdded = addedIds.has(product.id);

            return (
              <div
                key={product.id}
                className="menu-product-card glass-card"
                style={{ animationDelay: `${idx * 55}ms` }}
              >
                <div className="menu-product-emoji-wrap" aria-hidden="true">
                  <span className="menu-product-emoji">{product.emoji}</span>
                </div>

                <h3 className="menu-product-name">{product.name}</h3>
                <p className="menu-product-desc">{product.description}</p>

                <div className="menu-product-footer">
                  <span className="menu-product-price">
                    €{product.price.toFixed(2)}
                  </span>

                  <button
                    className={`menu-add-btn${isAdded ? ' menu-add-btn--added' : ''}`}
                    onClick={() => handleAddToCart(product)}
                    aria-label={`${product.name} in den Warenkorb`}
                  >
                    {isAdded ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Added
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Socials />
    </div>
  );
}
