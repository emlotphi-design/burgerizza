import { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);

const EMPTY_CONFIG = {
  orderType:   'walkin', // 'walkin' | 'pickup' | 'dine_in'
  tableNumber: '',
  customerName:'',
  phone:       '',
  payment:     'cash',   // 'cash' | 'card_in_store'
};

export function RestaurantModeProvider({ children }) {
  const [active, setActive] = useState(false);
  const [config, setConfig] = useState(EMPTY_CONFIG);

  function enter(navigate) {
    setActive(true);
    navigate('/menu');
  }

  function exit(navigate) {
    // Navigate FIRST — this unmounts the Checkout route before isRestaurantMode
    // becomes false, preventing CheckoutNormal's empty-cart redirect from firing.
    navigate('/admin/orders');
    setActive(false);
    setConfig(EMPTY_CONFIG);
  }

  return (
    <Ctx.Provider value={{ isRestaurantMode: active, rmConfig: config, setRmConfig: setConfig, enterRestaurantMode: enter, exitRestaurantMode: exit }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRestaurantMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRestaurantMode must be inside RestaurantModeProvider');
  return ctx;
}
