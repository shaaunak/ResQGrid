/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic Token System mapped to CSS Variables
        rq: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          'surface-2': 'var(--color-surface-2)',
          border: 'var(--color-border)',
          ink: 'var(--color-ink)',
          muted: 'var(--color-muted)',
          navy: 'var(--color-brand-navy)',
          signal: 'var(--color-signal)',
          critical: 'var(--color-critical)',
          high: 'var(--color-high)',
          medium: 'var(--color-medium)',
          low: 'var(--color-low)',
        },
        // Backward compatibility mappings
        app: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          'surface-subtle': 'var(--color-surface-2)',
          border: 'var(--color-border)',
          'border-strong': 'var(--color-border)',
          text: 'var(--color-ink)',
          'text-secondary': 'var(--color-muted)',
          'text-muted': 'var(--color-muted)',
          primary: 'var(--color-brand-navy)',
          'primary-hover': '#0E1D36',
          'primary-subtle': 'var(--color-surface-2)',
          navy: 'var(--color-brand-navy)',
          'navy-surface': 'var(--color-surface)',
          'navy-border': 'var(--color-border)',
          'navy-text': 'var(--color-ink)',
          critical: 'var(--color-critical)',
          'critical-subtle': '#FEF2F2',
          high: 'var(--color-high)',
          'high-subtle': '#FFF7ED',
          medium: 'var(--color-medium)',
          'medium-subtle': '#FEFCE8',
          low: 'var(--color-low)',
          'low-subtle': '#F0FDF4',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '14px'],
        xs: ['13px', '18px'], // Scale minimum 13px
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['28px', '36px'],
        '2xl': ['40px', '48px'],
        '3xl': ['64px', '72px'],
      },
      borderRadius: {
        card: '8px',
        input: '6px',
        pill: '999px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        floating: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}


