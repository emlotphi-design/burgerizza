import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Socials from './components/Socials';
import PizzaPage from './pages/PizzaBuilder';
import CartPage from './pages/Cart';
import MenuPage from './pages/Menu';
import BurgerPage from './pages/BurgerBuilder';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <Hero />
            <Socials />
          </>
        }
      />
      <Route path="/build-pizza" element={<PizzaPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/build-burger" element={<BurgerPage />} />
    </Routes>
  );
}
