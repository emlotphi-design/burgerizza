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
import AdminLayout from './admin/AdminLayout';
import AdminRoute from './admin/AdminRoute';
import { StaffLockedRoute } from './admin/context/StaffLockContext';
import AdminDashboard from './admin/pages/Dashboard';
import AdminOrders from './admin/pages/Orders';
import AdminProducts from './admin/pages/Products';
import AdminUsers from './admin/pages/Users';
import AdminSettings from './admin/pages/Settings';
import AdminPOS from './admin/pages/POS';
import AdminDrivers from './admin/pages/Drivers';
import AdminDriverDetail from './admin/pages/DriverDetail';
import AdminIngredients from './admin/pages/Ingredients';
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
        <Route path="/coming-soon"      element={<ComingSoon />} />
        <Route path="/order-tracking/:id" element={<OrderTracking />} />
        <Route path="/order-tracking"     element={<OrderTracking />} />

        {/* Food menu category pages */}
        <Route path="/burger"  element={<CategoryPage />} />
        <Route path="/pizza"   element={<CategoryPage />} />
        <Route path="/dessert" element={<CategoryPage />} />
        <Route path="/drinks"  element={<CategoryPage />} />

        {/* Kitchen Display System — full-screen, admin-protected, no sidebar */}
        <Route path="/kitchen" element={<AdminRoute><KitchenDisplay /></AdminRoute>} />

        {/* Admin panel — protected, own layout (no AnimatedRoutes animation) */}
        <Route
          path="/admin"
          element={<AdminRoute><AdminLayout /></AdminRoute>}
        >
          {/* /admin → orders: staff land on orders with no password prompt */}
          <Route index element={<Navigate to="/admin/orders" replace />} />
          <Route path="orders"    element={<AdminOrders />} />
          {/* Protected routes — redirect to orders + show modal on direct URL entry */}
          <Route path="dashboard" element={<StaffLockedRoute><AdminDashboard /></StaffLockedRoute>} />
          <Route path="products"  element={<AdminProducts />} />
          <Route path="users"     element={<StaffLockedRoute><AdminUsers /></StaffLockedRoute>} />
          <Route path="settings"  element={<StaffLockedRoute><AdminSettings /></StaffLockedRoute>} />
          <Route path="pos"       element={<AdminPOS />} />
          <Route path="drivers"      element={<AdminDrivers />} />
          <Route path="drivers/:id"  element={<AdminDriverDetail />} />
          <Route path="ingredients"  element={<AdminIngredients />} />
        </Route>
      </Routes>
    </div>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
