import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  // GitHub Pages serves this project from the /narrow-game/ subpath, so emit
  // relative asset URLs that resolve wherever the site is hosted.
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
    // Committed so the branch itself serves the playable site on GitHub Pages.
    outDir: 'docs',
    emptyOutDir: true,
  },
});

