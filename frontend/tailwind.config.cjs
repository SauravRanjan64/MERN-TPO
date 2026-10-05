// Tailwind CSS configuration
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB', // blue-600
        secondary: '#F59E0B', // amber-500
      },
    },
  },
  plugins: [],
};
