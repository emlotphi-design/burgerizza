import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MENU_ITEMS = [
  { label: 'Build Your Pizza', path: '/build-pizza'  },
  { label: 'American Pizza',   path: '/menu'         },
  { label: 'Italian Pizza',    path: '/menu'         },
  { label: 'Appetizers',       path: '/coming-soon'  },
  { label: 'Drinks',           path: '/menu'         },
  { label: 'My Pizzas',        path: '/cart'         },
  { label: 'Contact Us',       path: '/coming-soon'  },
  { label: 'About Us',         path: '/coming-soon'  },
  { label: 'Support',          path: '/coming-soon'  },
  { label: 'Delivery Areas',   path: '/coming-soon'  },
];

export default function MobileMenu({ onClose }) {
  const navigate = useNavigate();

  // Lock body scroll while mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Dark overlay — click anywhere to close */}
      <div className="mm-overlay" onClick={onClose} aria-hidden="true" />

      {/* Sidebar — slides in from right on mount */}
      <aside
        className="mm-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="mm-header">
          <div className="mm-brand">
            <svg width="32" height="32" viewBox="0 0 46 46" fill="none" aria-hidden="true">
              <rect width="46" height="46" rx="10" fill="#1A0A00" />
              <text x="23" y="33" textAnchor="middle"
                fontFamily="'Nunito', sans-serif" fontWeight="900"
                fontSize="26" fill="#F5C518" letterSpacing="-1">B</text>
              <line x1="12" y1="34" x2="34" y2="12"
                stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="mm-brand-name">BURGERIZZA</span>
          </div>
          <button className="mm-close-btn" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="mm-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              className="mm-item"
              onClick={() => handleNav(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mm-footer">
          <button className="mm-cta" onClick={() => handleNav('/coming-soon')}>
            Burgerizza Plus
          </button>
        </div>
      </aside>
    </>
  );
}
