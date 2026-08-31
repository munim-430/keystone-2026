/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            DEFAULT: '#0C4079',
            dark: '#072448',
            light: '#1A5AA3',
          },
          coral: {
            DEFAULT: '#EA333F',
            light: '#FF5E6D',
            dark: '#C71D29',
          },
          charcoal: '#202020',
        },
        corridor: {
          education: '#F598F2',
          manpower: '#F59E0B',
          export: '#10B981',
        },
      },
      fontFamily: {
        display: ['Figtree', 'Montserrat', 'sans-serif'],
        body: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      boxShadow: {
        'coral-glow': '0 0 25px rgba(234, 51, 63, 0.35)',
        'navy-glow': '0 0 25px rgba(12, 64, 121, 0.35)',
      },
    },
  },
};
