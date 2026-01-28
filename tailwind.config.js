const colors = require('./packages/shared/src/constants/custom-colors');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat_400Regular'],
        medium: ['Montserrat_500Medium'],
        semibold: ['Montserrat_600SemiBold'],
        bold: ['Montserrat_700Bold'],
      },
      colors: {
        ...colors,
        // Light mode colors
        lightBackground: colors.lightBackground,
        lightSurface: colors.lightSurface,
        lightTextPrimary: colors.lightTextPrimary,
        lightTextSecondary: colors.lightTextSecondary,
        lightAccentGray: colors.lightAccentGray,
        lightBorderGray: colors.lightBorderGray,
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
