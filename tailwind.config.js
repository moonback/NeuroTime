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
          50: '#e0f2ff',
          100: '#b3e0ff',
          200: '#80ccff',
          300: '#4db8ff',
          400: '#26a8ff',
          500: '#00d4ff', // Bleu électrique principal
          600: '#00b8e6',
          700: '#0099cc',
          800: '#007ab3',
          900: '#005c99',
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

