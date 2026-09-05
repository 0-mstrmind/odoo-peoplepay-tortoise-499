import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      'html2canvas': path.resolve(import.meta.dirname, 'node_modules/html2canvas/dist/html2canvas.esm.js'),
      'jspdf': path.resolve(import.meta.dirname, 'node_modules/jspdf/dist/jspdf.es.min.js'),
      'socket.io-client': path.resolve(import.meta.dirname, 'node_modules/socket.io-client/build/esm/index.js'),
    },
  },
  optimizeDeps: {
    include: ['html2canvas', 'jspdf', 'socket.io-client'],
  },
  server: {
    host: true,
    port: 5173,
  },
})
