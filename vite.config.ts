import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  // The page entry lives in vite/ so the build can be emitted into the repo
  // root, which is where GitHub Pages serves this project from. Relative asset
  // URLs keep it working under the /narrow-game/ subpath.
  root: 'vite',
  base: './',
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
  preview: {
    allowedHosts: process.env.ALLOWED_HOSTS
      ? process.env.ALLOWED_HOSTS.split(',')
      : undefined,
  },
  build: {
    // Emit into the repo root so the branch itself serves the playable site.
    outDir: '../',
    emptyOutDir: false,
  },
});

