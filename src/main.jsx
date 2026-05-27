import { BrowserRouter } from "react-router-dom";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PizzaProvider } from './context/PizzaContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { BurgerProvider } from './features/burger/store/burgerStore.jsx'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PizzaProvider>
          <BurgerProvider>
            <App />
          </BurgerProvider>
        </PizzaProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
