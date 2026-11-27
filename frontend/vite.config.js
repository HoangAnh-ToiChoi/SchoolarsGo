import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// File cấu hình là ESM: không có __dirname sẵn (Vite tự chèn khi chạy, nhưng lint và Node thuần thì không)
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

// Chống XSS: chỉ cho phép script từ chính trang. Chỉ gắn khi build (bản dev của Vite cần script nội tuyến).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https: wss://*.supabase.co", // wss: Supabase Realtime (chuông, học bổng mới)
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const cspPlugin = () => ({
  name: 'scholarsgo-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
});

// GitHub Pages không có rewrite cho SPA: dùng 404.html (bản sao index.html) để link sâu vẫn mở được
const spaFallbackPlugin = (outDir) => ({
  name: 'scholarsgo-spa-fallback',
  apply: 'build',
  closeBundle() {
    fs.copyFileSync(path.join(outDir, 'index.html'), path.join(outDir, '404.html'));
    fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  },
});

const VENDOR_CHUNKS = {
  react: ['react', 'react-dom', 'scheduler', 'react-router', 'react-router-dom', '@remix-run/router'],
  data: ['@reduxjs/toolkit', 'redux', 'react-redux', 'immer', 'reselect', '@tanstack/query-core', '@tanstack/react-query', 'axios'],
  ui: ['@radix-ui', '@floating-ui', 'lucide-react', '@heroicons/react', 'date-fns', 'tailwind-merge', 'clsx'],
};

function vendorChunk(id) {
  const match = id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
  if (!match) return undefined;
  const pkg = match[1];
  const scope = pkg.split('/')[0];
  const entry = Object.entries(VENDOR_CHUNKS).find(([, pkgs]) => pkgs.includes(pkg) || pkgs.includes(scope));
  return entry?.[0];
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const outDir = path.resolve(ROOT_DIR, 'dist');
  return {
    // Bản GitHub Pages (mode "pages") chạy dưới /SchoolarsGo/
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), cspPlugin(), ...(mode === 'pages' ? [spaFallbackPlugin(outDir)] : [])],
    resolve: {
      alias: {
        // Import từ gốc src: import { Button } from '~/components/ui/button'
        '~': path.resolve(ROOT_DIR, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Thư viện ít đổi tách riêng: lần deploy sau trình duyệt vẫn dùng bản cache, chỉ tải lại code app
          manualChunks: vendorChunk,
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
