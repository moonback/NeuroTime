/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // — Typography scale (kept here for line-height pairs)
      fontSize: {
        'xs':   ['0.75rem',   { lineHeight: '1rem'    }],
        'sm':   ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem',  { lineHeight: '1.375rem'}],
        'lg':   ['1rem',      { lineHeight: '1.5rem'  }],
        'xl':   ['1.125rem',  { lineHeight: '1.5rem'  }],
        '2xl':  ['1.25rem',   { lineHeight: '1.75rem' }],
        '3xl':  ['1.5rem',    { lineHeight: '2rem'    }],
        '4xl':  ['1.875rem',  { lineHeight: '2.25rem' }],
      },

      // — Font families
      fontFamily: {
        sans:    ['Figtree', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Syne',    'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'ui-monospace', 'monospace'],
      },

      // — Brand colors
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Semantic alias: financial values
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        dark: {
          50:  '#14172a',
          100: '#11142a',
          200: '#0e1024',
          300: '#0a0d1e',
          400: '#070916',
          500: '#050710',
          600: '#000000',
        },
      },

      // — Spacing
      spacing: {
        '18':  '4.5rem',
        '88':  '22rem',
        '128': '32rem',
      },

      // — Border radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // — Backdrop blur
      backdropBlur: {
        xs: '2px',
      },

      // — Shadows
      boxShadow: {
        'soft':    '0 2px 8px rgba(0, 0, 0, 0.12)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.15)',
      },

      // — Named animations (keyframes live in index.css)
      animation: {
        'fade-in-slow':  'fade-in 0.4s var(--ease-out)',
        'slide-up-slow': 'slide-up 0.4s var(--ease-out)',
      },
    },
  },
  plugins: [],
}
