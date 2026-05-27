import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { CATEGORIES } from '../data/menuData';

export default function MenuPage() {
  const navigate = useNavigate();

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
              className="menu-cat-card"
              onClick={() => navigate(cat.path)}
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              <span className="menu-cat-emoji" aria-hidden="true">{cat.emoji}</span>
              <span className="menu-cat-title">{cat.title}</span>
              <span className="menu-cat-sub">{cat.subtitle}</span>
            </button>
          ))}
        </div>
      </main>

      <Socials />
    </div>
  );
}
