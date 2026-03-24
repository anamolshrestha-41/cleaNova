/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      fontSize: {
        'display': ['1.625rem', { lineHeight: '2rem', fontWeight: '800' }],
        'body':    ['1.25rem',  { lineHeight: '1.75rem' }],
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.25rem', '4xl': '1.5rem' },
      transitionTimingFunction: { 'spring': 'cubic-bezier(0.34,1.56,0.64,1)' },
    },
  },
  plugins: [],
};
