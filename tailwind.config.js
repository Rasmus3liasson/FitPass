/** @type {import('tailwindcss').Config} */
const colors = require("./src/constants/Colors");

module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
       colors: {
        background: "#121212",
        surface: "#1E1E1E",
        primary: "#6366F1",
        textPrimary: "#FFFFFF",
        textSecondary: "#A0A0A0",
      },
    },
  },
  plugins: [],
}

