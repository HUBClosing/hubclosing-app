import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#F5A623',
          amber: '#F5A623',
          light: '#F5F5F0',
          dark: '#0A0F08',
          darker: '#060A04',
          card: '#111A0C',
          border: '#1A2614',
        },
        amber: {
          light: '#FBBE5E',
          DEFAULT: '#F5A623',
          dark: '#E8913A',
          deeper: '#D4782E',
        },
        cream: {
          DEFAULT: '#F5F5F0',
          dark: '#D8D5CC',
          muted: '#A8A49C',
        },
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #FBBE5E 0%, #F5A623 50%, #E8913A 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0A0F08 0%, #060A04 100%)',
        'gradient-card': 'linear-gradient(145deg, #111A0C 0%, #0D1509 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(245, 166, 35, 0.15)',
        'glow-lg': '0 0 40px rgba(245, 166, 35, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
