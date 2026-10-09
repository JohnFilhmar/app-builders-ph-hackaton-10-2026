/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        banig: { 50: '#FFFBF2', 100: '#FDF2DC', 200: '#F6E2B8', 300: '#E9CC92' },
        sipag: { 300: '#FFD970', 400: '#F5C542', 500: '#E8A90E', 600: '#B98200' },
        tara: { 300: '#C79A6B', 500: '#8B5A2B', 700: '#5C3A1A', 900: '#3A2410' },
        leaf: { 100: '#E3F5EA', 500: '#2E9E5B', 700: '#1F6E3F' },
      },
    },
  },
  plugins: [],
};
