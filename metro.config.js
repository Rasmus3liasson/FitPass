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
  stream: 'stream-browserify',
  crypto: 'crypto-browserify',
  util: 'util',
};

module.exports = withNativeWind(config, { input: './global.css' });
