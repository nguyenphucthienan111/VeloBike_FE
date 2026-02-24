/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './hooks/**/*.{js,ts,jsx,tsx}', './App.tsx', './index.tsx'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#111111',
        secondary: '#666666',
        accent: '#EF4444',
        'accent-hover': '#DC2626',
        surface: '#F9FAFB',
      },
    },
  },
  plugins: [],
};
