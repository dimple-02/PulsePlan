/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pulse: {
          bg: '#0B0A0F',
          surface: '#14121C',
          surface2: '#1C1926',
          surface3: '#262234',
          lavender: '#C9B8FF',
          pink: '#FFD6E8',
          white: '#F8F6EF',
          muted: '#A6A1B5',
          border: 'rgba(201, 184, 255, 0.12)',
          borderHover: 'rgba(201, 184, 255, 0.28)',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Primary Indigo
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
