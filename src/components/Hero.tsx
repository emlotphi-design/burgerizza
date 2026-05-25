import { Link } from 'react-router-dom';
import heroImg from '../assets/icons/hero.png';

export default function Hero() {
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
        <Link to="/build-pizza" className="btn">BAU DEINE{'\n'}PIZZA</Link>
        <Link to="/menu" className="btn">MENU</Link>
        <Link to="/build-burger" className="btn">BAU DEINEN{'\n'}BURGER</Link>
      </div>
    </main>
  );
}
