// Shared Tailwind configuration for both mobile and web
const colors = require('./custom-colors');

module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        medium: ['Montserrat-Medium', 'system-ui', 'sans-serif'],
        semibold: ['Montserrat-SemiBold', 'system-ui', 'sans-serif'],
        bold: ['Montserrat-Bold', 'system-ui', 'sans-serif'],
      },
      colors,
    },
  },
  plugins: [],
};
