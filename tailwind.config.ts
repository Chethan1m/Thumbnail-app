import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-syne)', 'Syne', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fff1f8',
          100: '#ffe4f3',
          200: '#ffc9e8',
          300: '#ff9dd0',
          400: '#ff61b0',
          500: '#ff2d8d',
          600: '#f0096e',
          700: '#d00057',
          800: '#ac0049',
          900: '#8e0040',
          950: '#570023',
        },
        dark: {
          900: '#080812',
          800: '#0f0f1e',
          700: '#16162a',
          600: '#1e1e35',
          500: '#252540',
          400: '#2e2e50',
        },
        accent: {
          purple: '#7c3aed',
          pink:   '#db2777',
          gold:   '#f59e0b',
          cyan:   '#06b6d4',
        },
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #ff2d8d 0%, #7c3aed 100%)',
        'gradient-dark':    'linear-gradient(180deg, #080812 0%, #0f0f1e 100%)',
        'gradient-glow':    'radial-gradient(ellipse at center, rgba(255,45,141,0.15) 0%, transparent 70%)',
        'gradient-card':    'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'glow-brand': '0 0 40px rgba(255, 45, 141, 0.3)',
        'glow-purple': '0 0 40px rgba(124, 58, 237, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 48px rgba(255, 45, 141, 0.2)',
      },
      animation: {
        'float':         'float 6s ease-in-out infinite',
        'pulse-slow':    'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x':    'gradient-x 4s ease infinite',
        'slide-up':      'slide-up 0.5s ease-out',
        'fade-in':       'fade-in 0.3s ease-out',
        'shimmer':       'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
