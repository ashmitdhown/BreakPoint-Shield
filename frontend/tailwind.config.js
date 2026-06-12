/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172032',
          900: '#0f172a',
          925: '#0b1120',
          950: '#060c18',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          muted: '#1d4ed8',
          glow: 'rgba(59,130,246,0.35)',
        },
        success: {
          DEFAULT: '#22c55e',
          muted: '#166534',
          bg: 'rgba(34,197,94,0.12)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          muted: '#92400e',
          bg: 'rgba(245,158,11,0.12)',
        },
        danger: {
          DEFAULT: '#ef4444',
          muted: '#991b1b',
          bg: 'rgba(239,68,68,0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'terminal-blink': 'termBlink 1s step-end infinite',
        'score-fill': 'scoreFill 1.2s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'matrix-rain': 'matrixRain 20s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(59,130,246,0.4)' },
          '50%': { boxShadow: '0 0 28px rgba(59,130,246,0.8)' },
        },
        termBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scoreFill: {
          from: { strokeDashoffset: '339' },
          to: { strokeDashoffset: 'var(--target-offset)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        matrixRain: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.4)',
        'glow-green': '0 0 20px rgba(34,197,94,0.3)',
        'glow-red': '0 0 20px rgba(239,68,68,0.3)',
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
