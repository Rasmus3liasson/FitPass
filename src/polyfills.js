// src/polyfills.js
import 'react-native-url-polyfill/auto';
import 'websocket-polyfill';

// Polyfill for Node.js stream module
if (typeof global !== 'undefined') {
  global.Stream = require('stream-browserify');
  global.stream = global.Stream;
}

// Additional polyfills for crypto and util if needed
if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = require('crypto-browserify');
}

if (typeof global !== 'undefined' && !global.util) {
  global.util = require('util');
}

// Disable WebSocket warnings if they appear
if (typeof global !== 'undefined') {
  global.__DEV__ = __DEV__;
}
