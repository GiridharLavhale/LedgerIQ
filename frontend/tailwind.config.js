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
        // DESIGN.md Tokens
        canvas: '#f8f9ff',
        surface: {
          DEFAULT: '#ffffff',
          dim: '#cbdbf5',
          bright: '#f8f9ff',
          lowest: '#ffffff',
          low: '#eff4ff',
          container: '#e5eeff',
          high: '#dce9ff',
          highest: '#d3e4fe',
          variant: '#d3e4fe',
        },
        'on-surface': {
          DEFAULT: '#0b1c30',
          variant: '#44474e',
        },
        'inverse-surface': '#213145',
        'inverse-on-surface': '#eaf1ff',
        border: {
          DEFAULT: '#e2e8f0',
          variant: '#c5c6cf',
          subtle: '#eff4ff',
        },
        primary: {
          DEFAULT: '#031635',
          container: '#1a2b4b',
          'on-primary': '#ffffff',
          'on-container': '#8293b8',
          fixed: '#d8e2ff',
          dim: '#b6c6ef',
        },
        action: {
          DEFAULT: '#0066ff',
          hover: '#0050cc',
          light: '#e5eeff',
        },
        secondary: {
          DEFAULT: '#0050cc',
          container: '#0266ff',
          'on-secondary': '#ffffff',
          'on-container': '#f9f7ff',
        },
        tertiary: {
          DEFAULT: '#00875a',
          container: '#e6f7f0',
          'on-tertiary': '#ffffff',
          'on-container': '#00a774',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#fee2e2',
          'on-error': '#ffffff',
          'on-container': '#93000a',
        },
        warning: {
          DEFAULT: '#b45309',
          container: '#fef3c7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem', // 4px
        sm: '0.125rem',     // 2px
        md: '0.375rem',     // 6px
        lg: '0.5rem',       // 8px
        xl: '0.75rem',      // 12px
        full: '9999px',
      },
      boxShadow: {
        card: 'none',
        drawer: '0px 10px 25px -5px rgba(11, 28, 48, 0.1), 0px 8px 10px -6px rgba(11, 28, 48, 0.05)',
        modal: '0px 20px 25px -5px rgba(11, 28, 48, 0.15), 0px 10px 10px -5px rgba(11, 28, 48, 0.04)',
      }
    },
  },
  plugins: [],
}
