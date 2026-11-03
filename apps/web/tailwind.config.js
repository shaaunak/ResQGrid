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
        // Premium ResQGrid Reference Palette:
        // Main BG: #FAFAF7, Secondary: #F3F6F5, Surface: #FFFFFF
        // Primary text: #142638, Secondary: #62727E
        // Primary teal: #087F7A, Deep teal: #08615E, Subtle teal: #E8F4F1
        // Border: #E2E9E7
        rq: {
          bg: 'var(--color-bg)',
          'bg-subtle': 'var(--color-bg-subtle)',
          surface: 'var(--color-surface)',
          'surface-2': 'var(--color-surface-2)',
          border: 'var(--color-border)',
          'border-light': 'var(--color-border-light)',
          ink: 'var(--color-ink)',
          muted: 'var(--color-muted)',
          navy: 'var(--color-brand-navy)',
          teal: {
            DEFAULT: '#087F7A',
            deep: '#08615E',
            light: '#E8F4F1',
            hover: '#076D69',
          },
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
          primary: '#087F7A',
          'primary-hover': '#08615E',
          'primary-subtle': '#E8F4F1',
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
        sans: ['"IBM Plex Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Newsreader', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '14px'],
        xs: ['13px', '18px'], // Scale minimum 13px
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '26px'],
        xl: ['22px', '30px'],
        '2xl': ['28px', '36px'],
        '3xl': ['36px', '44px'],
        '4xl': ['48px', '54px'],
        '5xl': ['56px', '62px'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        pill: '999px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(20, 38, 56, 0.04)',
        card: '0 2px 8px -2px rgba(20, 38, 56, 0.05), 0 1px 3px -1px rgba(20, 38, 56, 0.03)',
        floating: '0 12px 32px -8px rgba(20, 38, 56, 0.08), 0 4px 12px -2px rgba(20, 38, 56, 0.03)',
        elevated: '0 20px 40px -12px rgba(20, 38, 56, 0.12), 0 8px 16px -4px rgba(20, 38, 56, 0.04)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}


