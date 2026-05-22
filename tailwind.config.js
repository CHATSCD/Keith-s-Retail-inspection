/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#ede6ff',
          100: '#ddd6ff',
          200: '#c4b5fd',
          300: '#a78bfa',
          400: '#9b6dff',
          500: '#863bff',
          600: '#7c2dff',
          700: '#7e14ff',
          800: '#6911d6',
          900: '#560ea8',
        },
      },
    },
  },
  plugins: [],
}

