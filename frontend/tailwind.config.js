import animate from 'tailwindcss-animate';

// Pha một màu gốc: pct% màu gốc + phần còn lại là trắng; dark > 0 thì pha thêm đen.
// Trả về hàm để Tailwind vẫn dùng được độ mờ (VD bg-primary/10).
const tone = (name, pct = 100, dark = 0) => {
  let color = `rgb(var(--c-${name}))`;
  if (dark) color = `color-mix(in srgb, ${color} ${100 - dark}%, black)`;
  if (pct < 100) color = `color-mix(in srgb, ${color} ${pct}%, white)`;
  return ({ opacityValue }) =>
    opacityValue === undefined || opacityValue === '1'
      ? color
      : `color-mix(in srgb, ${color} calc(${opacityValue} * 100%), transparent)`;
};

// Thang 50–900 từ một màu gốc (600 = đúng màu gốc)
const scale = (name) => ({
  50: tone(name, 7), 100: tone(name, 13), 200: tone(name, 26), 300: tone(name, 45), 400: tone(name, 75),
  500: tone(name, 90), 600: tone(name), 700: tone(name, 100, 18), 800: tone(name, 100, 34), 900: tone(name, 100, 50),
});

// Bộ màu cho nhãn: chữ, nền, viền
const badge = (name) => ({ fg: tone(name, 100, name === 'primary' ? 10 : 0), bg: tone(name, 7), line: tone(name, 26) });

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // Mọi màu sinh ra từ 5 màu gốc trong src/index.css (--c-primary, --c-neutral,
      // --c-success, --c-warning, --c-danger). File này chỉ pha sáng/tối, không chứa mã màu.
      colors: {
        white: '#FFFFFF',
        transparent: 'transparent',
        current: 'currentColor',
        // Màu gốc
        // 300/400 dùng làm màu nhấn ở trang cũ nên đậm hơn thang chuẩn
        primary: { ...scale('primary'), 300: tone('primary', 85), 400: tone('primary'), DEFAULT: tone('primary'), foreground: '#FFFFFF' },
        neutral: scale('neutral'),
        success: scale('success'),
        warning: scale('warning'),
        danger: scale('danger'),
        // Tên dùng trong component mới
        brand: scale('primary'),
        heading: tone('neutral'),
        canvas: tone('neutral', 3),
        surface: '#FFFFFF',
        hover: tone('neutral', 6),
        track: tone('neutral', 9),
        line: { DEFAULT: tone('neutral', 13), soft: tone('neutral', 7), strong: tone('neutral', 24) },
        fg: { DEFAULT: tone('neutral', 100, 45), secondary: tone('neutral', 100, 15), soft: tone('neutral'), muted: tone('neutral', 82) },
        urgent: badge('danger'),
        soon: badge('warning'),
        open: badge('success'),
        abroad: badge('primary'),
        domestic: badge('neutral'),
        // Token của shadcn/ui
        background: '#FFFFFF',
        foreground: tone('neutral', 100, 45),
        border: tone('neutral', 13),
        input: tone('neutral', 13),
        ring: tone('primary'),
        card: { DEFAULT: '#FFFFFF', foreground: tone('neutral', 100, 45) },
        popover: { DEFAULT: '#FFFFFF', foreground: tone('neutral', 100, 45) },
        secondary: { DEFAULT: tone('neutral', 6), foreground: tone('neutral', 100, 45) },
        muted: { DEFAULT: tone('neutral', 6), foreground: tone('neutral', 82) },
        accent: { DEFAULT: tone('neutral', 6), foreground: tone('neutral', 100, 45) },
        destructive: { DEFAULT: tone('danger'), foreground: '#FFFFFF' },
        // Trang cũ (chưa làm lại) dùng thang ink: 950 sáng nhất → 100 đậm nhất
        ink: {
          950: '#FFFFFF',
          900: tone('neutral', 4),
          800: tone('neutral', 10),
          700: tone('neutral', 20),
          600: tone('neutral', 32),
          500: tone('neutral', 62),
          400: tone('neutral', 80),
          300: tone('neutral', 92),
          200: tone('neutral'),
          100: tone('neutral', 100, 45),
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
        'tile-hover': '0 12px 28px -12px color-mix(in srgb, rgb(var(--c-primary)) 35%, transparent), 0 2px 6px rgba(16,24,40,.05)',
        menu: '0 16px 40px -12px rgba(16,24,40,.18), 0 2px 6px rgba(16,24,40,.05)',
        search: '0 1px 2px rgba(16,24,40,.06), 0 6px 16px -6px rgba(16,24,40,.12)',
        // Legacy
        'glow':    '0 0 20px color-mix(in srgb, rgb(var(--c-primary)) 25%, transparent)',
        'glow-lg': '0 0 40px color-mix(in srgb, rgb(var(--c-primary)) 35%, transparent)',
        'glow-sm': '0 0 10px color-mix(in srgb, rgb(var(--c-primary)) 15%, transparent)',
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
          '0%, 100%': { boxShadow: '0 0 15px color-mix(in srgb, rgb(var(--c-primary)) 15%, transparent)' },
          '50%':      { boxShadow: '0 0 35px color-mix(in srgb, rgb(var(--c-primary)) 45%, transparent)' },
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
