import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Target browsers that cover iOS Safari 14+ and Android Chrome 80+.
    // Without an explicit target, Vite's default 'modules' may leave some
    // modern syntax (e.g. ??) un-transpiled for older mobile WebViews.
    target: 'es2020',
  },
})
