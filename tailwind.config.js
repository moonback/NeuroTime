/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e0f7ff',
          100: '#b3ebff',
          200: '#80deff',
          300: '#4dd0ff',
          400: '#26c5ff',
          500: '#00baff',
          600: '#00a8f0',
          700: '#0093e0',
          800: '#007fd0',
          900: '#005db3',
        },
        dark: {
          50: '#1a1f2e',
          100: '#151a27',
          200: '#0f141f',
          300: '#0a0e1a',
          400: '#050812',
          500: '#000000',
        }
      }
    },
  },
  plugins: [],
}

