import tailwindConfig from "../../tailwind.config.js";

const colors = tailwindConfig.theme.extend.colors;

const tintColorLight = colors.primary;
const tintColorDark = "#fff";

export default {
  link: colors.primary,
  light: {
    text: colors.textPrimary,
    background: colors.background,
    tint: tintColorLight,
    tabIconDefault: colors.textSecondary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: colors.textPrimary,
    background: colors.surface,
    tint: tintColorDark,
    tabIconDefault: colors.textSecondary,
    tabIconSelected: tintColorDark,
  },
};
