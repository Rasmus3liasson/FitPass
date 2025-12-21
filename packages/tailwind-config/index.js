// Shared Tailwind configuration for both mobile and web
const colors = {
  // Dark mode colors
  background: "#121212",
  surface: "#1E1E1E",
  primary: "#6366F1",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0A0",

  // Light mode colors
  lightBackground: "#FEFCF3",
  lightSurface: "#F8F6F0",
  lightTextPrimary: "#1F2937",
  lightTextSecondary: "#6B7280",
  lightAccentGray: "#F3F4F6",
  lightBorderGray: "#D1D5DB",

  // Shared colors
  intensityLow: "#4CAF50",
  intensityMedium: "#FFC107",
  intensityHigh: "#F44336",
  accentYellow: "#FFCA28",
  accentOrange: "#FF5722",
  accentBlue: "#2196F3",
  accentRed: "#F44336",
  accentGreen: "#4CAF50",
  accentPurple: "#8B5CF6",
  accentPink: "#EC4899",
  accentGray: "#2A2A2A",
  borderGray: "#9CA3AF",
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
