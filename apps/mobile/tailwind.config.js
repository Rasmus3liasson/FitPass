const sharedConfig = require('@fitpass/tailwind-config');

module.exports = {
  ...sharedConfig,
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/shared/src/components/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require("nativewind/preset")],
};
