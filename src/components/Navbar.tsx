import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePizzaStore } from '../context/PizzaContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import MobileMenu from './MobileMenu.jsx';

/* Pages where the Home button IS shown */
const HOME_ROUTES = new Set(['/cart']);

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconPizza() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Slice outline */}
      <path d="M12 2 2.5 21.5h19L12 2z" />
      {/* Crust arc */}
      <path d="M3 21 Q12 16.5 21 21" />
      {/* Toppings */}
      <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.8"  cy="19.2" r="1"   fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="19.2" r="1"   fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconBurger() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Top bun dome */}
      <path d="M4 11a8 8 0 0 1 16 0H4z" />
      {/* Patty / filling */}
      <rect x="3" y="11" width="18" height="3" rx="1" />
      {/* Bottom bun */}
      <path d="M3 14h18v1.5A1.5 1.5 0 0 1 19.5 17h-15A1.5 1.5 0 0 1 3 15.5V14z" />
    </svg>
  );
}

export default function Navbar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store      = usePizzaStore() as any;
  const count: number = store?.pizzas?.length ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { isLoggedIn } = useAuth() as any;

  const showHome = HOME_ROUTES.has(location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
    <nav className="nav">
      {/* Brand — navigates to home without hard reload */}
      <button className="brand" aria-label="Zur Startseite" onClick={() => navigate('/')}>
        <svg className="brand-logo" width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden="true">
          <rect width="46" height="46" rx="10" fill="#1A0A00" />
          <text x="23" y="33" textAnchor="middle"
            fontFamily="'Nunito', sans-serif" fontWeight="900"
            fontSize="26" fill="#F5C518" letterSpacing="-1">B</text>
          <line x1="12" y1="34" x2="34" y2="12"
            stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span className="brand-name">BURGERIZZA</span>
      </button>

      <div className="nav-icons">
        {/* Home button — visible on non-home pages */}
        {showHome && (
          <button
            className="nav-btn nav-home-btn"
            aria-label="Zur Startseite"
            onClick={() => navigate('/build-pizza')}
            title="Pizza Builder"
          >
            <IconHome />
          </button>
        )}

        {/* Cross-builder shortcut — pizza↔burger */}
        {location.pathname === '/build-pizza' && (
          <button
            className="nav-btn nav-builder-btn"
            aria-label="Zum Burger Builder"
            title="Burger Builder"
            onClick={() => navigate('/build-burger')}
          >
            <IconBurger />
          </button>
        )}
        {location.pathname === '/build-burger' && (
          <button
            className="nav-btn nav-builder-btn"
            aria-label="Zum Pizza Builder"
            title="Pizza Builder"
            onClick={() => navigate('/build-pizza')}
          >
            <IconPizza />
          </button>
        )}

        <button
          className="nav-btn nav-cart-btn"
          aria-label={`Warenkorb${count > 0 ? ` (${count})` : ''}`}
          onClick={() => navigate('/cart')}
        >
          <IconCart />
          {count > 0 && (
            <span className="nav-cart-badge" key={count}>{count}</span>
          )}
        </button>

        <button
          className="nav-btn"
          aria-label="Profil"
          onClick={() => navigate(isLoggedIn ? '/profile' : '/auth')}
        >
          <IconUser />
        </button>

        <button className="nav-btn" aria-label="Menü" onClick={() => setMenuOpen(true)}><IconMenu /></button>
      </div>
    </nav>
    {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}
