/** @type {import('tailwindcss').Config} */
import colors from "./src/constants/custom-colors";

export const content = ["./src/**/*.{js,jsx,ts,tsx}"];
export const presets = [require("nativewind/preset")];
export const theme = {
  extend: {
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

