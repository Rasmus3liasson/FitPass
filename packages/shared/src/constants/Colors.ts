// src/constants/Colors.ts
import colors from './custom-colors';

const tintColorLight: string = colors.primary;
const tintColorDark = 'white';

const Colors = {
  link: colors.primary,
  light: {
    text: colors.lightTextPrimary,
    background: colors.lightBackground,
    surface: colors.lightSurface,
    tint: tintColorLight,
    tabIconDefault: colors.lightTextSecondary,
    tabIconSelected: tintColorLight,
    accentGray: colors.lightAccentGray,
    borderGray: colors.lightBorderGray,
    textSecondary: colors.lightTextSecondary,
  },
  dark: {
    text: colors.textPrimary,
    background: colors.background,
    surface: colors.surface,
    tint: tintColorDark,
    tabIconDefault: colors.textSecondary,
    tabIconSelected: tintColorDark,
    accentGray: colors.accentGray,
    borderGray: colors.borderGray,
    textSecondary: colors.textSecondary,
  },
};

export default Colors;
