/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Chuyển sang tông Xanh Slate/Indigo dịu mắt hơn
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98', // Màu chủ đạo trầm, chuyên nghiệp
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        // Secondary: Tông tím khói (Muted Purple)
        secondary: {
          50: '#f5f3f7',
          100: '#e8e4ec',
          200: '#d0c9d6',
          300: '#b6acc0',
          400: '#9c8eaa',
          500: '#827094',
          600: '#6a597a',
          700: '#53465f',
          800: '#3c3345',
          900: '#25202b',
        },
        success: {
          50: '#f2f9f1',
          500: '#62a46e', // Xanh lá xám dịu
          600: '#498a54',
          700: '#34703f',
        },
        warning: {
          50: '#fff9f2',
          500: '#d99430', // Cam đất thay vì cam tươi
          600: '#bc791d',
          700: '#9c6010',
        },
        danger: {
          50: '#fff5f5',
          500: '#bc5454', // Đỏ đô nhẹ
          600: '#a33c3c',
          700: '#892727',
        },
        // Surface: Tránh dùng màu trắng tinh (Pure White #FFFFFF)
        surface: {
          DEFAULT: '#ffffff',      // Nền card trắng tinh khôi
          sunken: '#f7f9fb',      // Nền body hơi xám xanh để dịu mắt
          muted: '#e4e7eb',       // Cho các thành phần phụ
        },
        // Text: Giảm độ đen tuyệt đối để tăng tính thẩm mỹ
        content: {
          primary: '#1f2933',     // Chữ chính
          secondary: '#52606d',   // Chữ phụ
          tertiary: '#9aa5b1',    // Chữ mờ/placeholder
        }
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
        // Đổ bóng mềm hơn với độ mờ cao hơn
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
        'button': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
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
