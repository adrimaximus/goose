import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config
export default defineConfig({
  server: {
    port: 5374,
    strictPort: true,
    watch: {
      ignored: ['.vite/**', '.vite/build/**', 'out/**', '**/.vite/**'],
      usePolling: false,
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
  define: {
    'process.env.GOOSE_TUNNEL': JSON.stringify(process.env.GOOSE_TUNNEL !== 'no' && process.env.GOOSE_TUNNEL !== 'none'),
  },

  plugins: [
    tailwindcss(),
    react(),
  ],

  build: {
    target: 'esnext'
  }
});
