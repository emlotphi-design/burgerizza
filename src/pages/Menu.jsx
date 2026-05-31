import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { CATEGORIES } from '../utils/menuData';
import { useRestaurantMode } from '../store/RestaurantModeContext';

/* In restaurant mode, burger/pizza go straight to the real builders */
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
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: '15px',
            color: 'rgba(26, 10, 0, 0.42)',
            marginTop: '10px',
          }}>
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
                <span style={{
                  marginTop: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'rgba(26,10,0,0.45)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
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
