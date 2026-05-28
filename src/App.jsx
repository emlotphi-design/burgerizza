import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import MyPizzasPage from './pages/MyPizzasPage';
import MyBurgersPage from './pages/MyBurgersPage';
import ComingSoon from './pages/ComingSoon';
import CategoryPage from './pages/CategoryPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthCallback from './pages/AuthCallback';

const BUILDER_ROUTES = new Set(['/build-pizza', '/build-burger']);

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return;

    const fromBuilder = BUILDER_ROUTES.has(displayLocation.pathname);
    const toBuilder   = BUILDER_ROUTES.has(location.pathname);

    if (fromBuilder && toBuilder) {
      setExiting(true);
      const id = setTimeout(() => {
        setDisplayLocation(location);
        setExiting(false);
      }, 210);
      return () => clearTimeout(id);
    }

    setDisplayLocation(location);
  }, [location.pathname]);

  return (
    <div className={exiting ? 'route-exiting' : undefined}>
      <Routes location={displayLocation}>
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
        <Route path="/build-pizza"  element={<PizzaBuilder />} />
        <Route path="/menu"         element={<MenuPage />} />
        <Route path="/build-burger" element={<BurgerPage />} />
        <Route path="/cart"         element={<CartPage />} />
        <Route path="/checkout"     element={<CheckoutPage />} />
        <Route path="/auth"          element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/profile"      element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
        <Route path="/my-pizzas"    element={<ProtectedRoute><MyPizzasPage /></ProtectedRoute>} />
        <Route path="/my-burgers"   element={<ProtectedRoute><MyBurgersPage /></ProtectedRoute>} />
        <Route path="/coming-soon"  element={<ComingSoon />} />

        {/* Food menu category pages */}
        <Route path="/burger"  element={<CategoryPage />} />
        <Route path="/pizza"   element={<CategoryPage />} />
        <Route path="/dessert" element={<CategoryPage />} />
        <Route path="/drinks"  element={<CategoryPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
