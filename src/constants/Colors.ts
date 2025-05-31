// src/constants/Colors.ts
import colors from "./custom-colors";

const tintColorLight: string = colors.primary;
const tintColorDark = "#fff";

const Colors = {
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

export default Colors;


