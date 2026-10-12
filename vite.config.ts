import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // Optionally restrict dev-server hostnames, e.g. when running behind a
    // proxy: ALLOWED_HOSTS="example.com,foo.example.com" npm run dev
    allowedHosts: process.env.ALLOWED_HOSTS
      ? process.env.ALLOWED_HOSTS.split(',')
      : undefined,
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});

