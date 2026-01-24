const sharedConfig = require('@fitpass/tailwind-config');

module.exports = {
  ...sharedConfig,
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/shared/src/components/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    ...sharedConfig.theme,
    extend: {
      ...sharedConfig.theme?.extend,
    },
  },
  plugins: [],
  future: {
    disableColorOpacityUtilitiesByDefault: false,
  },
  experimental: {
    // Disable CSS variables that require reanimated
    cssVariables: false,
  },
};
