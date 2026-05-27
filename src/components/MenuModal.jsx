import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../data/menuData';

export default function MenuModal({ onClose }) {
  const navigate = useNavigate();

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCategory = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="menu-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="menu-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Menu categories"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="menu-modal-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          ×
        </button>

        <div className="menu-modal-header">
          <h2 className="menu-modal-title">UNSER MENÜ</h2>
          <p className="menu-modal-subtitle">What are you craving today?</p>
        </div>

        <div className="menu-modal-grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className="menu-cat-card"
              onClick={() => handleCategory(cat.path)}
            >
              <span className="menu-cat-emoji" aria-hidden="true">{cat.emoji}</span>
              <span className="menu-cat-title">{cat.title}</span>
              <span className="menu-cat-sub">{cat.subtitle}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
