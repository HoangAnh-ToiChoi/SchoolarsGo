import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Design v2 ─────────────────────────────────────
        // Token của shadcn/ui (giá trị nằm trong src/index.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        // Màu thật nằm trong src/index.css (biến --sg-*). Đổi màu chỉ sửa file CSS đó.
        brand: { 50: 'rgb(var(--sg-brand-50) / <alpha-value>)', 100: 'rgb(var(--sg-brand-100) / <alpha-value>)', 200: 'rgb(var(--sg-brand-200) / <alpha-value>)', 500: 'rgb(var(--sg-brand-500) / <alpha-value>)', 600: 'rgb(var(--sg-brand-600) / <alpha-value>)', 700: 'rgb(var(--sg-brand-700) / <alpha-value>)', 900: 'rgb(var(--sg-brand-900) / <alpha-value>)' },
        heading: 'rgb(var(--sg-heading) / <alpha-value>)',
        canvas: 'rgb(var(--sg-canvas) / <alpha-value>)',
        surface: 'rgb(var(--sg-surface) / <alpha-value>)',
        hover: 'rgb(var(--sg-hover) / <alpha-value>)',
        track: 'rgb(var(--sg-track) / <alpha-value>)',
        line: { DEFAULT: 'rgb(var(--sg-line) / <alpha-value>)', soft: 'rgb(var(--sg-line-soft) / <alpha-value>)', strong: 'rgb(var(--sg-line-strong) / <alpha-value>)' },
        fg: { DEFAULT: 'rgb(var(--sg-fg) / <alpha-value>)', secondary: 'rgb(var(--sg-fg-secondary) / <alpha-value>)', muted: 'rgb(var(--sg-fg-muted) / <alpha-value>)', soft: 'rgb(var(--sg-fg-soft) / <alpha-value>)' },
        urgent: { fg: 'rgb(var(--sg-urgent-fg) / <alpha-value>)', bg: 'rgb(var(--sg-urgent-bg) / <alpha-value>)', line: 'rgb(var(--sg-urgent-line) / <alpha-value>)' },
        soon: { fg: 'rgb(var(--sg-soon-fg) / <alpha-value>)', bg: 'rgb(var(--sg-soon-bg) / <alpha-value>)', line: 'rgb(var(--sg-soon-line) / <alpha-value>)' },
        open: { fg: 'rgb(var(--sg-open-fg) / <alpha-value>)', bg: 'rgb(var(--sg-open-bg) / <alpha-value>)', line: 'rgb(var(--sg-open-line) / <alpha-value>)' },
        abroad: { fg: 'rgb(var(--sg-abroad-fg) / <alpha-value>)', bg: 'rgb(var(--sg-abroad-bg) / <alpha-value>)', line: 'rgb(var(--sg-abroad-line) / <alpha-value>)' },
        domestic: { fg: 'rgb(var(--sg-domestic-fg) / <alpha-value>)', bg: 'rgb(var(--sg-domestic-bg) / <alpha-value>)', line: 'rgb(var(--sg-domestic-line) / <alpha-value>)' },
        // ── Legacy (các trang chưa làm lại) ─────────────
        // Cyan accent — 300/400 are theme-aware via CSS vars, rest static
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: 'rgb(var(--primary-300) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // UI surfaces — all levels are theme-aware via CSS vars
        ink: {
          950: 'rgb(var(--ink-950) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
        },
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      height: {
        header: '64px',
        control: '40px', // điều khiển trong header
        nav: '38px', // mục sidebar
        filter: '34px', // nút bộ lọc
      },
      width: {
        sidebar: '256px',
      },
      fontSize: {
        // Design v2
        'page-title': ['24px', { lineHeight: '30px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'card-title': ['17px', { lineHeight: '23px', letterSpacing: '-0.015em', fontWeight: '700' }],
        'block-title': ['15px', { lineHeight: '20px', fontWeight: '700' }],
        // Legacy
        'display':   ['3.5rem', { lineHeight: '1.05', fontWeight: '800' }],
        'heading-1': ['2rem',   { lineHeight: '1.2',  fontWeight: '700' }],
        'heading-2': ['1.5rem', { lineHeight: '1.3',  fontWeight: '700' }],
        'heading-3': ['1.25rem',{ lineHeight: '1.4',  fontWeight: '600' }],
        'body-lg':   ['1.125rem',{ lineHeight: '1.6' }],
        'body':      ['1rem',   { lineHeight: '1.6' }],
        'body-sm':   ['0.875rem',{ lineHeight: '1.5' }],
        'caption':   ['0.75rem', { lineHeight: '1.4' }],
      },
      borderRadius: {
        // Design v2
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        tile: '14px', // thẻ
        inner: '10px', // ô con trong thẻ, ô tìm kiếm
        control: '8px', // nút, mục menu
        // Legacy
        'card':   '0.75rem',
        'button': '0.5rem',
        'input':  '0.5rem',
        'badge':  '0.25rem',
        'tag':    '9999px',
      },
      spacing: {
        'page':    '2rem',
        'section': '5rem',
      },
      boxShadow: {
        // Design v2
        tile: '0 1px 2px rgba(16,24,40,.04)',
        'tile-hover': '0 12px 28px -12px rgba(79,70,229,.35), 0 2px 6px rgba(16,24,40,.05)',
        menu: '0 16px 40px -12px rgba(16,24,40,.18), 0 2px 6px rgba(16,24,40,.05)',
        search: '0 1px 2px rgba(16,24,40,.06), 0 6px 16px -6px rgba(16,24,40,.12)',
        // Legacy
        'glow':    '0 0 20px rgba(34,211,238,0.25)',
        'glow-lg': '0 0 40px rgba(34,211,238,0.35)',
        'glow-sm': '0 0 10px rgba(34,211,238,0.15)',
        'card':    '0 1px 3px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in':        'fadeIn 0.25s ease-out',
        'slide-up':       'slideUp 0.3s ease-out',
        'slide-down':     'slideDown 0.3s ease-out',
        'fade-in-up':     'fadeInUp 0.5s ease-out both',
        'fade-in-up-1':   'fadeInUp 0.5s 0.1s ease-out both',
        'fade-in-up-2':   'fadeInUp 0.5s 0.2s ease-out both',
        'fade-in-up-3':   'fadeInUp 0.5s 0.3s ease-out both',
        'pulse-glow':     'pulseGlow 3s ease-in-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'float':          'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(34,211,238,0.15)' },
          '50%':      { boxShadow: '0 0 35px rgba(34,211,238,0.45)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [animate],
};
