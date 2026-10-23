import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            // Suppress noisy ECONNRESET / ECONNREFUSED logs on browser refreshes or backend restarts
            if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
              if (res && !res.headersSent && res.writeHead) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Backend server reconnecting...' }));
              }
              return;
            }
            console.warn('[Vite Proxy Warning]:', err.message);
          });
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
})
                                                                                                                          