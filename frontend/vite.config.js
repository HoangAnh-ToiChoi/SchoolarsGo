import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Chống XSS: chỉ cho phép script từ chính trang. Chỉ gắn khi build (bản dev của Vite cần script nội tuyến).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https:",
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const outDir = path.resolve(__dirname, 'dist');
  return {
    // Bản GitHub Pages (mode "pages") chạy dưới /SchoolarsGo/
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), cspPlugin(), ...(mode === 'pages' ? [spaFallbackPlugin(outDir)] : [])],
    resolve: {
      alias: {
        // Import từ gốc src: import { Button } from '~/components/ui/button'
        '~': path.resolve(__dirname, './src'),
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
