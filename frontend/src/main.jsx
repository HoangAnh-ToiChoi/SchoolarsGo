import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';
import { useThemeStore } from './stores/themeStore';

// Apply theme before React renders to avoid flash of unstyled content
try {
  const stored = JSON.parse(localStorage.getItem('scholarsgo-theme') || '{}');
  const theme = stored?.state?.theme ?? 'dark';
  document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
} catch {
  document.documentElement.dataset.theme = 'dark';
}

function ThemeApplier() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return null;
}

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    integrations: [Sentry.browserTracingIntegration()],
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeApplier />
        <App />
        <Toaster
          position="bottom-center"
          containerStyle={{ bottom: 32 }}
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(20, 20, 20, 0.92)',
              color: '#f8fafc',
              borderRadius: '9999px',
              padding: '10px 20px',
              fontSize: '0.875rem',
              fontWeight: '500',
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              backdropFilter: 'blur(8px)',
              maxWidth: '360px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#f8fafc' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
