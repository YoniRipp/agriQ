/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // ink-* uses CSS variables so both light and dark modes
        // are driven by a single :root / .dark swap in index.css
        ink: {
          950: 'var(--color-ink-950)',
          900: 'var(--color-ink-900)',
          800: 'var(--color-ink-800)',
          700: 'var(--color-ink-700)',
          600: 'var(--color-ink-600)',
          500: 'var(--color-ink-500)',
          400: 'var(--color-ink-400)',
          300: 'var(--color-ink-300)',
          200: 'var(--color-ink-200)',
          100: 'var(--color-ink-100)',
        },
        ok:        { DEFAULT: '#22c55e', bg: '#052e16', border: '#14532d' },
        warn:      { DEFAULT: '#f59e0b', bg: '#2e1a05', border: '#78350f' },
        crit:      { DEFAULT: '#ef4444', bg: '#2e0707', border: '#7f1d1d' },
        emergency: { DEFAULT: '#f43f5e', bg: '#2e0514', border: '#881337' },
      },
    },
  },
  plugins: [],
};
