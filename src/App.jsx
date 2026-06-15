import './styles/App.css';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useRTL } from './hooks/useRTL';
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
import OrderTracking from './pages/OrderTracking';
import CategoryPage from './pages/CategoryPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthCallback from './pages/AuthCallback';
import AdminLayout from './admin/components/layout/AdminLayout';
import AdminGuard from './admin/routes/AdminGuard';
import OrdersPage from './admin/pages/Orders';
import DashboardPage from './admin/pages/Dashboard';
import ProductsPage from './admin/pages/Products';
import DriversPage from './admin/pages/Drivers';
import SettingsPage from './admin/pages/Settings';
import KitchenRoute from './admin/routes/KitchenRoute';
import KitchenDisplay from './kitchen/KitchenDisplay';
import RestaurantModeBanner from './components/RestaurantModeBanner';
import RestaurantModeCartBar from './components/RestaurantModeCartBar';
import RestaurantModeBuilderBar from './components/RestaurantModeBuilderBar';
import { useRestaurantMode } from './store/RestaurantModeContext';

const BUILDER_ROUTES = new Set(['/build-pizza', '/build-burger']);

function AnimatedRoutes() {
  useRTL(); /* Apply RTL/LTR direction to <html> on language change */
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return;

    const fromBuilder = BUILDER_ROUTES.has(displayLocation.pathname);
    const toBuilder = BUILDER_ROUTES.has(location.pathname);

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

  const { isRestaurantMode } = useRestaurantMode();
  const isAdminRoute = displayLocation.pathname.startsWith('/admin');

  return (
    <div className={exiting ? 'route-exiting' : undefined}>
      {isRestaurantMode && !isAdminRoute && <RestaurantModeBanner />}
      {isRestaurantMode && !isAdminRoute && <RestaurantModeBuilderBar />}
      {isRestaurantMode && !isAdminRoute && <RestaurantModeCartBar />}
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
        <Route path="/build-pizza" element={<PizzaBuilder />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/build-burger" element={<BurgerPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/profile" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
        <Route path="/my-pizzas" element={<ProtectedRoute><MyPizzasPage /></ProtectedRoute>} />
        <Route path="/my-burgers" element={<ProtectedRoute><MyBurgersPage /></ProtectedRoute>} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/order-tracking/:id" element={<OrderTracking />} />
        <Route path="/order-tracking" element={<OrderTracking />} />

        {/* Food menu category pages */}
        <Route path="/burger" element={<CategoryPage />} />
        <Route path="/pizza" element={<CategoryPage />} />
        <Route path="/dessert" element={<CategoryPage />} />
        <Route path="/drinks" element={<CategoryPage />} />

        {/* Kitchen Display System — full-screen, admin-protected, no sidebar */}
        <Route path="/kitchen" element={<KitchenRoute><KitchenDisplay /></KitchenRoute>} />

        {/* Admin panel */}
        <Route
          path="/admin"
          element={<AdminGuard><AdminLayout /></AdminGuard>}
        >
          <Route index element={<Navigate to="/admin/orders" replace />} />
          <Route path="orders"    element={<OrdersPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products"  element={<ProductsPage />} />
          <Route path="drivers"   element={<DriversPage />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
