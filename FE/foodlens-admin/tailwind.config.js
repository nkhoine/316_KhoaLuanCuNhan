/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0A2540',
        secondary: '#4A90D9',
        accent: '#7FDBFF',
        cyan: '#00B4D8',
        bg: '#F0F8FF',
        surface: '#FFFFFF',
        'bg-alt': '#F5F5F5',
        soft: '#AED6F1',
        text: '#1A1A2E',
        muted: '#5B6B7D',
        line: 'rgba(10,37,64,.12)',
        sidebar: '#0A2540',
        'sidebar-text': '#DCEBF7',
        ok: '#1E8E5A',
        warn: '#B46A00',
        err: '#C0392B',
        chip: '#E8F4FD',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}