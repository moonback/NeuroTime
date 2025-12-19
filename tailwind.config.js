/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],  // 13px (au lieu de 14px)
        'base': ['0.875rem', { lineHeight: '1.375rem' }], // 14px (au lieu de 16px)
        'lg': ['1rem', { lineHeight: '1.5rem' }],        // 16px (au lieu de 18px)
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px (au lieu de 20px)
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px (au lieu de 24px)
        '3xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px (au lieu de 30px)
        '4xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px (au lieu de 36px)
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Bleu moderne et sobre
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        dark: {
          50: '#1e2332',
          100: '#1a1f2e',
          200: '#151a27',
          300: '#0f141f',
          400: '#0a0e1a',
          500: '#050812',
          600: '#000000',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'fade-in-slow': 'fade-in 0.6s ease-out',
        'slide-up-slow': 'slide-up 0.6s ease-out',
      }
    },
  },
  plugins: [],
}

