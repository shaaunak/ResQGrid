/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          darkest: '#0b1320',
          base: '#142235',
          surface: '#1c2d44',
          card: '#223652',
          border: '#2e4566',
          slate: '#526276',
          text: '#F7F8F6',
          muted: '#8e9eb3',
          teal: '#137C82',
          'teal-bright': '#17a2a8',
          amber: '#E7A645',
          red: '#CF4B4B',
          green: '#2ec4b6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}

