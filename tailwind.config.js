module.exports = {
  content: ['./src/templates/**/*.{html,njk}'],
  theme: {
    extend: {},
    fontFamily: {
      sans: [
        'ui-sans-serif',
        //'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        '"Noto Sans"',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
    },
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    styled: true,
    themes: [
      'light',
      'dark',
      /* {
        black: {
          primary: '#343232',
          secondary: '#343232',
          accent: '#343232',
          'base-100': '#000000',
          'base-200': '#0D0D0D',
          'base-300': '#1A1919',
          neutral: '#272626',
          'neutral-focus': '#343232',
          info: '#0000ff',
          success: '#008000',
          warning: '#ffff00',
          error: '#ff0000',
        },
      }, */
    ],
  },
};
