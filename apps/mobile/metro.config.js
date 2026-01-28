// Learn more https://docs.expo.io/guides/customizing-metro

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const extraNodeModules = {
  'expo-router': path.resolve(__dirname, 'node_modules/expo-router'),
};

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver configuration for Node.js polyfills
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require'];

// Add Node.js polyfills and monorepo alias
config.resolver.alias = {
  stream: 'readable-stream',
  crypto: false, // Disable crypto entirely
  util: 'util',
  events: 'events',
  buffer: 'buffer',
  process: 'process/browser',
  'cipher-base': false, // Disable cipher-base entirely
  'crypto-browserify': false, // Disable crypto-browserify
  '@shared': path.resolve(__dirname, '../../packages/shared/src'),
};
config.resolver.extraNodeModules = extraNodeModules;

// Add watchFolders for monorepo shared package
config.watchFolders = [
  path.resolve(__dirname, '../../packages/shared'),
  path.resolve(__dirname, '../../node_modules'),
];

// Configure globals for Node.js modules
config.resolver.platforms = ['native', 'web', 'default'];

// Exclude problematic packages
config.resolver.blockList = [/node_modules\/cipher-base\/.*/];

module.exports = withNativeWind(config, { input: './global.css' });
