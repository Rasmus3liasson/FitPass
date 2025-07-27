// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver configuration for Node.js polyfills
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require'];

// Add Node.js polyfills
config.resolver.alias = {
  stream: 'readable-stream',
  crypto: false, // Disable crypto entirely
  util: 'util',
  events: 'events',
  buffer: 'buffer',
  process: 'process/browser',
  'cipher-base': false, // Disable cipher-base entirely
  'crypto-browserify': false, // Disable crypto-browserify
};

// Configure globals for Node.js modules
config.resolver.platforms = ['native', 'web', 'default'];

// Exclude problematic packages
config.resolver.blockList = [
  /node_modules\/cipher-base\/.*/,
];

module.exports = withNativeWind(config, { input: './global.css' });
