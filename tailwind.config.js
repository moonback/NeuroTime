/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
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
        'glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.4)',
      },
      animation: {
        'fade-in-slow': 'fade-in 0.6s ease-out',
        'slide-up-slow': 'slide-up 0.6s ease-out',
      }
    },
  },
  plugins: [],
}

