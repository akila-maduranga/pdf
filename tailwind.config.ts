import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'velvet-bg': '#1a0f1e',
        'velvet-surface': '#2a1a30',
        'velvet-card': '#33203a',
        'velvet-border': '#4a3555',
        'velvet-text': '#f0e6f5',
        'rose-gold': '#c77dba',
        'deep-rose': '#a855a0',
        'blush': '#e8b4d8',
        'midnight': '#0f0a12',
        'plum': '#6b3a7d',
        'wine': '#8b2252',
        'amber-glow': '#d4a574',
        ink: '#16140f',
        paper: '#f6f3ec',
        vellum: '#efe9db',
        moss: '#3c4a3e',
        rust: '#a8462f',
        brass: '#b8934a',
        line: '#d8d0bd',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
