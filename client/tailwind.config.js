/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    borderRadius: {
      none: '0px',
      sm: '4px',
      DEFAULT: '4px',
      md: '4px',
      lg: '4px',
      xl: '4px',
      '2xl': '4px',
      '3xl': '4px',
      full: '9999px',
    },
    extend: {
      colors: {
        // Razorpay Blade Brand Tokens
        prussian: {
          DEFAULT: '#0C2651', // Dominant institutional navy
          dark: '#081C3D',
          light: '#13356E',
        },
        dodger: {
          DEFAULT: '#0D94FB', // Vibrant primary action blue
          hover: '#0B82DE',
          light: '#E6F4FE',
          dark: '#0A77CA',
        },
        // Base canvas & surfaces
        canvas: '#F4F6F8', // Neutral soft gray product background
        surface: {
          DEFAULT: '#FFFFFF',
          raised: '#FFFFFF',
          subtle: '#F8FAFC',
          hover: '#F1F5F9',
        },
        // Semantic status colors (strictly separate from brand blues)
        semantic: {
          success: '#10B981',
          'success-bg': '#ECFDF5',
          'success-border': '#A7F3D0',
          warning: '#F59E0B',
          'warning-bg': '#FFFBEB',
          'warning-border': '#FDE68A',
          error: '#EF4444',
          'error-bg': '#FEF2F2',
          'error-border': '#FECACA',
          info: '#3B82F6',
          'info-bg': '#EFF6FF',
          'info-border': '#BFDBFE',
        },
        // Hairline borders
        hairline: {
          DEFAULT: '#E2E8F0',
          subtle: 'rgba(12, 38, 81, 0.08)',
          strong: 'rgba(12, 38, 81, 0.16)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"IBM Plex Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Consolas', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'blade-sm': '0 1px 2px 0 rgba(12, 38, 81, 0.05)',
        'blade-md': '0 4px 6px -1px rgba(12, 38, 81, 0.08), 0 2px 4px -2px rgba(12, 38, 81, 0.05)',
        'blade-hover': '0 6px 12px -2px rgba(12, 38, 81, 0.10)',
        'blade-focus': '0 0 0 3px rgba(13, 148, 251, 0.25)',
      },
      transitionTimingFunction: {
        'razorsense': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '120': '120ms',
        '150': '150ms',
        '200': '200ms',
      },
    },
  },
  plugins: [],
}
