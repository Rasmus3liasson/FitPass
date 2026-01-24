/** @type {import('tailwindcss').Config} */
import colors from './src/constants/custom-colors';

export const content = ['./src/**/*.{js,jsx,ts,tsx}'];
export const presets = [require('nativewind/preset')];
export const theme = {
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
};
export const plugins = [];
export const darkMode = 'class';
