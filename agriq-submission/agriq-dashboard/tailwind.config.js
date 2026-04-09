/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0a0d0b',
          900: '#101512',
          800: '#151a17',
          700: '#1e2420',
          600: '#2a322d',
          500: '#3b443e',
          400: '#5c6660',
          300: '#8a938d',
          200: '#c2c8c4',
          100: '#e8ebe9',
        },
        ok: { DEFAULT: '#22c55e', bg: '#052e16', border: '#14532d' },
        warn: { DEFAULT: '#f59e0b', bg: '#2e1a05', border: '#78350f' },
        crit: { DEFAULT: '#ef4444', bg: '#2e0707', border: '#7f1d1d' },
        emergency: { DEFAULT: '#f43f5e', bg: '#2e0514', border: '#881337' },
      },
    },
  },
  plugins: [],
};
