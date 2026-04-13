import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Fas 2: TanStackRouterVite läggs till här när src/routes/ existerar.
//   import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
//   plugins: [TanStackRouterVite({ target: 'react', autoCodeSplitting: true }), ...]
//
// [GA] Fas 7: security headers-plugin med CSP-nonce läggs till här.

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
