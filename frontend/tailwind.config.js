/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        // Surface tokens – dùng thay thế bg-white để giảm cường độ trắng
        surface: {
          DEFAULT: '#f8fafcc0', // off-white cho card, modal, input panel
          muted: '#f1f5f9b1',   // cho body, section xen kẽ, btn hover
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'heading-1': ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-2': ['1.5rem', { lineHeight: '1.3', fontWeight: '700' }],
        'heading-3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },
      borderRadius: {
        'card': '1rem',
        'button': '0.75rem',
        'input': '0.75rem',
        'badge': '0.5rem',
        'tag': '9999px',
      },
      boxShadow: {
        'card': '0 2px 8px 0 rgb(0 0 0 / 0.09), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card-hover': '0 20px 40px -8px rgb(0 0 0 / 0.16), 0 8px 20px -4px rgb(0 0 0 / 0.10)',
        'button': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      spacing: {
        'page': '2rem',
        'section': '5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
