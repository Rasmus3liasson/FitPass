// Polyfills for React Native environment
// This file is imported in _layout.tsx

// Buffer polyfill (if needed)
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Process polyfill (if needed)
if (typeof global.process === 'undefined') {
  global.process = require('process');
}

export { };

