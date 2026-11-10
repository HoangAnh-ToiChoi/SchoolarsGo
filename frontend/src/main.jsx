import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import * as Sentry from '@sentry/react';
import App from '~/App';
import { Provider } from 'react-redux';
import { store } from '~/store';
import { loggedIn } from '~/store/slices/authSlice';
import { DEMO_USER } from '~/utils/demo/demoData';
import '~/index.css';
import { color } from '~/utils/palette';

// Bản demo: đăng nhập sẵn bằng tài khoản minh họa để xem được menu tài khoản
if (import.meta.env.VITE_DEMO_MODE === 'true' && !store.getState().auth.isAuthenticated) {
  store.dispatch(loggedIn(DEMO_USER));
}

// Chế độ tối chưa làm: giao diện luôn sáng
document.documentElement.dataset.theme = store.getState().ui.theme;

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
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
          <Toaster
            position="bottom-center"
            containerStyle={{ bottom: 32 }}
            toastOptions={{
              duration: 3000,
              style: {
                background: color('neutral', { alpha: 0.95 }),
                color: '#FFFFFF',
                borderRadius: '9999px',
                padding: '10px 20px',
                fontSize: '0.875rem',
                fontWeight: '500',
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                backdropFilter: 'blur(8px)',
                maxWidth: '360px',
              },
              success: {
                iconTheme: { primary: color('success', { mix: 75 }), secondary: '#FFFFFF' },
              },
              error: {
                iconTheme: { primary: color('danger', { mix: 75 }), secondary: '#FFFFFF' },
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
