import { BrowserRouter } from "react-router-dom";
import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './i18n'
import App from './App.jsx'
import { CartProvider } from './store/cartStore'
import { PizzaProvider } from './store/PizzaContext'
import { AuthProvider } from './store/AuthContext'
import { BurgerProvider } from './features/burger/store/burgerStore'
import { RestaurantModeProvider } from './store/RestaurantModeContext'
import { OrderingProvider } from './store/OrderingContext'

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[App] render error:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: 24,
          fontFamily: 'Nunito, sans-serif', background: '#F5C518',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#1A0A00', marginBottom: 12, fontSize: 22, fontWeight: 900 }}>
            Ups! Etwas ist schiefgelaufen.
          </h2>
          <p style={{ color: '#1A0A00', marginBottom: 28, maxWidth: 340, fontWeight: 700 }}>
            Bitte lade die Seite neu. Wenn das Problem weiterhin besteht, leere deinen Browser-Cache.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#1A0A00', color: '#F5C518', border: 'none',
              borderRadius: 50, padding: '12px 32px', fontSize: 16,
              fontWeight: 900, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}
          >
            Seite neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <PizzaProvider>
              <BurgerProvider>
                <RestaurantModeProvider>
                  <OrderingProvider>
                    <App />
                  </OrderingProvider>
                </RestaurantModeProvider>
              </BurgerProvider>
            </PizzaProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
