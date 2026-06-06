import { useState } from 'react';
import heroImg from '../assets/icons/hero.png';
import { Link } from 'react-router-dom';
import MenuModal from './MenuModal';

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="hero">
      <h1 className="heading">
        <span className="h-dark">BAU DEINE </span>
        <span className="h-red">BURGERIZZA</span>
        <span className="h-dark">!!!</span>
      </h1>

      <div className="food-wrap">
        <img src={heroImg} alt="Burgerizza" className="food-img" />
      </div>

      <div className="ctas">
        <Link to="/build-pizza" className="btn">
          BAU DEINE <br /> PIZZA
        </Link>

        <button className="btn" onClick={() => setMenuOpen(true)}>
          MENU
        </button>

        <Link to="/build-burger" className="btn">
          BAU DEINEN <br /> BURGER
        </Link>
      </div>

      {menuOpen && <MenuModal onClose={() => setMenuOpen(false)} />}
    </main>
  );
}
