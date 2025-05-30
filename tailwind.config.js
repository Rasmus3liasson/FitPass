/** @type {import('tailwindcss').Config} */
import colors from "./src/constants/custom-colors";

export const content = ["./src/**/*.{js,jsx,ts,tsx}"];
export const presets = [require("nativewind/preset")];
export const theme = {
  extend: {
    colors,
  },
};
export const plugins = [];

