import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// TanStack Router plugin (Fas 2 K2 — återinförd post-Fas-0-borttagning).
// Plugin ligger FÖRE react() per TanStack-rekommendation.
//
// [GA] Fas 7: security headers-plugin med CSP-nonce läggs till här.

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
