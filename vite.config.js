import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { qrcode } from 'vite-plugin-qrcode';
import { fileURLToPath } from 'node:url';

const page = p => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: './',
  css: { transformer: 'lightningcss' },
  build: {
    cssMinify: 'lightningcss',
    rollupOptions: {
      input: { level: page('level.html') },
      output: { manualChunks: id => id.includes('node_modules/three/') ? 'three' : undefined },
    },
  },
  server: { host: true },
  plugins: [
    qrcode(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'BLACKBOX/AGENT — как устроен ИИ-агент изнутри',
        short_name: 'BLACKBOX',
        theme_color: '#0d0f13', background_color: '#0d0f13', display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
