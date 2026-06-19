/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: '#05050A',
        surface: '#0B0B14',
        panel: '#11111D',
        line: '#1E1E2E',
        cyan: { DEFAULT: '#00F0FF', dim: '#00B8C7' },
        magenta: { DEFAULT: '#FF2EC4', dim: '#C71F99' },
        violet: '#7C3AED',
        ink: '#E7E7F4',
        muted: '#8B8BA3',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0,240,255,0.35), 0 0 60px rgba(0,240,255,0.12)',
        'neon-magenta': '0 0 20px rgba(255,46,196,0.35), 0 0 60px rgba(255,46,196,0.12)',
      },
      backgroundImage: {
        'grid-glow': 'linear-gradient(to right, rgba(0,240,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,240,255,0.06) 1px, transparent 1px)',
      },
      animation: {
        'spin-slow': 'spin 18s linear infinite',
        'spin-slower': 'spin 32s linear infinite reverse',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'drift': 'drift 60s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%,100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
        drift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-1000px)' },
        }
      }
    },
  },
  plugins: [],
}
