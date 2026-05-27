import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Socials from './components/Socials';
import PizzaBuilder from './pages/PizzaBuilder';
import MenuPage from './pages/Menu';
import BurgerPage from './pages/BurgerBuilder';
import CartPage from './pages/Cart';
import CheckoutPage from './pages/Checkout';
import AuthPage from './pages/AuthPage';
import ProfileDashboard from './pages/ProfileDashboard';
import ComingSoon from './pages/ComingSoon';

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
      <Route path="/build-pizza" element={<PizzaBuilder />} />
      <Route path="/menu"        element={<MenuPage />} />
      <Route path="/build-burger" element={<BurgerPage />} />
      <Route path="/cart"        element={<CartPage />} />
      <Route path="/checkout"    element={<CheckoutPage />} />
      <Route path="/auth"        element={<AuthPage />} />
      <Route path="/profile"      element={<ProfileDashboard />} />
      <Route path="/coming-soon"  element={<ComingSoon />} />
    </Routes>
  );
}
