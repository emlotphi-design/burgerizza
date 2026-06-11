import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { CATEGORIES } from '../utils/menuData';
import { useRestaurantMode } from '../store/RestaurantModeContext';

const RM_OVERRIDES = { burger: '/build-burger', pizza: '/build-pizza' };

export default function MenuPage() {
  const navigate = useNavigate();
  const { isRestaurantMode } = useRestaurantMode();

  function getPath(cat) {
    if (isRestaurantMode && RM_OVERRIDES[cat.id]) return RM_OVERRIDES[cat.id];
    return cat.path;
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main className="menu-page-full">
        <div className="menu-page-full-header">
          <h1 className="heading">
            <span className="h-dark">UNSER </span>
            <span className="h-red">MENÜ</span>
          </h1>
          <p className="menu-page-tagline">
            What are you craving today?
          </p>
        </div>

        <div className="menu-page-full-grid">
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat.id}
              className="menu-cat-card glass-card"
              onClick={() => navigate(getPath(cat))}
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              <span className="menu-cat-emoji" aria-hidden="true">{cat.emoji}</span>
              <span className="menu-cat-title">{cat.title}</span>
              <span className="menu-cat-sub">{cat.subtitle}</span>
              {isRestaurantMode && RM_OVERRIDES[cat.id] && (
                <span className="menu-cat-builder-tag">
                  Custom Builder →
                </span>
              )}
            </button>
          ))}
        </div>
      </main>

      <Socials />
    </div>
  );
}
