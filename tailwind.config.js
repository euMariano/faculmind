/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ufpe: {
          burgundy: '#7A1C30',
          dark: '#5a1322',
          light: '#9e2b43',
          soft: '#fdf2f4'
        },
        mind: {
          green: '#2e7d32',
          emerald: '#10b981',
          sage: '#52796f',
          light: '#e8f5e9',
          cream: '#fbfbf8'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
