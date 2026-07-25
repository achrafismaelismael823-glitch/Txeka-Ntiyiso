module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        tn: {
          900: '#050b14',
          800: '#0a1929',
          700: '#0d2137',
          600: '#112240',
          500: '#1a3a5c',
          400: '#233d5a',
          300: '#2a4d75',
          200: '#3d6a9a',
          100: '#5a8fc4',
          50:  '#8ab4d9',
        },
        cyan: {
          DEFAULT: '#00e5ff',
          dark: '#00b8cc',
          light: '#66f0ff',
          glow: 'rgba(0,229,255,0.35)',
        },
        silver: {
          DEFAULT: '#c0c5ce',
          dark: '#8a9199',
          light: '#e2e5e9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0,229,255,0.4), 0 0 20px rgba(0,229,255,0.2)',
        'neon-lg': '0 0 20px rgba(0,229,255,0.5), 0 0 40px rgba(0,229,255,0.3)',
        'glass': '0 8px 32px 0 rgba(0,0,0,0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'tn-gradient': 'linear-gradient(135deg, #0a1929 0%, #0d2137 50%, #112240 100%)',
        'cyan-gradient': 'linear-gradient(90deg, #00e5ff 0%, #00b8cc 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0,229,255,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0,229,255,0.6), 0 0 40px rgba(0,229,255,0.2)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
