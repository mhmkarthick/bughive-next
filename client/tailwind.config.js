/** @type {import('tailwindcss').Config} */
const cssVar = (name) => `rgb(var(--${name}) / <alpha-value>)`

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: cssVar('primary'), hover: cssVar('primary-hover'), light: cssVar('primary-light') },
        surface:  { 1: cssVar('surface-1'), 2: cssVar('surface-2'), 3: cssVar('surface-3'), 4: cssVar('surface-4'), 5: cssVar('surface-5') },
        border:   { DEFAULT: cssVar('border'), strong: cssVar('border-strong') },
        ink:      { 1: cssVar('ink-1'), 2: cssVar('ink-2'), 3: cssVar('ink-3') },
        success:  cssVar('success'),
        warning:  cssVar('warning'),
        danger:   cssVar('danger'),
        info:     cssVar('info'),
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: { xl: '12px', '2xl': '16px', '3xl': '20px' },
      animation: {
        'fade-in':  'fadeIn .2s ease',
        'slide-up': 'slideUp .2s ease',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0, transform: 'translateY(4px)' },   to: { opacity: 1, transform: 'none' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' },  to: { opacity: 1, transform: 'none' } },
      },
    },
  },
  plugins: [],
}
