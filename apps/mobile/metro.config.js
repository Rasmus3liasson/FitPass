// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Monorepo configuration
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Watch all workspace packages
config.watchFolders = [monorepoRoot];

// Let Metro resolve from workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

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
  // Force React to resolve from local node_modules
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

// Configure globals for Node.js modules
config.resolver.platforms = ['native', 'web', 'default'];

// Exclude problematic packages
config.resolver.blockList = [/node_modules\/cipher-base\/.*/];

module.exports = withNativeWind(config, { input: './global.css' });
