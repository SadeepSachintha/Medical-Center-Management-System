/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Medical UI Colors (Harmonious Teal/Blue palette)
        medical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#032338',
        },
        darkbg: {
          50: '#1f2937',
          100: '#111827',
          200: '#0f172a',
          300: '#020617',
        },
        triage: {
          bp: '#3b82f6',    // Blue
          hr: '#ef4444',    // Red/Rose
          temp: '#f59e0b',  // Amber
          bmi: '#10b981'    // Emerald
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(14, 165, 233, 0.1), 0 0 10px rgba(14, 165, 233, 0.05)' },
          '100%': { boxShadow: '0 0 15px rgba(14, 165, 233, 0.4), 0 0 25px rgba(14, 165, 233, 0.2)' },
        }
      }
    },
  },
  plugins: [],
}
