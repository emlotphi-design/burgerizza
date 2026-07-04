import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { CATEGORIES, MENU_ITEMS } from '../utils/menuData';
import { usePizzaStore } from '../store/PizzaContext';
import { useRestaurantMode } from '../store/RestaurantModeContext';
import NutritionBadge from '../components/NutritionBadge';

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

        {/* ── Page hero ── */}
        <div className="cat-page-hero">
          <div className="cat-page-emoji-wrap" aria-hidden="true">
            <span className="cat-page-emoji">{catData.emoji}</span>
          </div>
          <h1 className="cat-page-title">{catData.title}</h1>
          <p className="cat-page-subtitle">{catData.subtitle}</p>
          <button className="cat-page-back" onClick={() => navigate('/menu')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Menu
          </button>
        </div>

        {/* ── Category switcher tabs ── */}
        <div className="cat-tabs" role="tablist" aria-label="Menu categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={cat.id === category}
              className={`cat-tab${cat.id === category ? ' cat-tab--active' : ''}`}
              onClick={() => navigate('/' + cat.id)}
            >
              <span className="cat-tab-emoji" aria-hidden="true">{cat.emoji}</span>
              <span className="cat-tab-label">{cat.title}</span>
            </button>
          ))}
        </div>

        {/* ── Restaurant mode: builder shortcut ── */}
        {isRestaurantMode && BUILDER_ROUTES[category] && (
          <div className="cat-builder-shortcut">
            <button
              className="cat-builder-btn"
              onClick={() => navigate(BUILDER_ROUTES[category])}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Custom {category === 'burger' ? 'Burger' : 'Pizza'} Builder
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Product grid ── */}
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
                  <span className="nutrition-price-group">
                    <span className="menu-product-price">
                      €{product.price.toFixed(2)}
                    </span>
                    <NutritionBadge calories={product.calories} size="sm" />
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
