/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6f4ff',
          100: '#bde3ff',
          200: '#80c8ff',
          300: '#40aaff',
          400: '#1a97ff',
          500: '#0099ff',
          600: '#007ddd',
          700: '#0062bb',
          800: '#004a8f',
          900: '#003366',
        },
        accent: {
          50:  '#fff0f0',
          100: '#ffd6d6',
          200: '#ffaaaa',
          300: '#ff7777',
          400: '#ee3333',
          500: '#cc0000',
          600: '#aa0000',
          700: '#880000',
          800: '#660000',
          900: '#440000',
        },
      },
    },
  },
  plugins: [],
}
