// Shared Tailwind configuration for both mobile and web
const colors = {
  background: "#2B2B23",
  surface: "#3C3A33",
  primary: "#CFCAC1",
  textPrimary: "#F5F3EB",
  textSecondary: "#CFCAC1",

  lightBackground: "#F5F1E7",
  lightSurface: "#E8E2D6",
  lightTextPrimary: "#3C3A33",
  lightTextSecondary: "#7A756B",
  lightAccentGray: "#DAD4C9",
  lightBorderGray: "#C0B8AC",

  accentGreen: "#7BAE89",
  intensityLow: "#A3CFA0",
  intensityMedium: "#D4E2B6",
  intensityHigh: "#E3BFA0",

  accentYellow: "#D8C38C",
  accentOrange: "#D9986E",
  accentBlue: "#6C8EA4",
  accentRed: "#C67A6D",
  accentPurple: "#9A7CB3",
  accentPink: "#D89CA3",
  accentGray: "#6B675F",
  borderGray: "#B0A99A",
  accentBrown: "#7B3F00",
};

module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Montserrat', 'system-ui', 'sans-serif'],
        'medium': ['Montserrat-Medium', 'system-ui', 'sans-serif'],
        'semibold': ['Montserrat-SemiBold', 'system-ui', 'sans-serif'],
        'bold': ['Montserrat-Bold', 'system-ui', 'sans-serif'],
      },
      colors,
    },
  },
  plugins: [],
};
