import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark sensual palette
        bg: '#0c0a12',
        surface: '#15121e',
        'surface-2': '#1c1828',
        'surface-3': '#241f32',
        rose: '#e11d48',
        'rose-dark': '#9f1239',
        'rose-light': '#fb7185',
        gold: '#c9a84c',
        'gold-dim': '#a08435',
        'gold-light': '#e0c068',
        text: '#e8e2d9',
        'text-muted': '#7a7586',
        'text-dim': '#4a4556',
        border: 'rgba(255,255,255,0.06)',
        'border-hover': 'rgba(255,255,255,0.12)',
        danger: '#e05252',
        // Admin-specific
        brass: '#c9a84c',
        paper: '#e8e2d9',
        line: 'rgba(255,255,255,0.06)',
        rust: '#e05252',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
        label: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        glow: 'glow 2s ease-in-out infinite alternate',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(225,29,72,0.1)' },
          '100%': { boxShadow: '0 0 25px rgba(225,29,72,0.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

export default config;