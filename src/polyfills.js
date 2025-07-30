// src/polyfills.js
import 'react-native-get-random-values'; // Must be first import
import 'react-native-url-polyfill/auto';

// Set up global polyfills for Node.js modules
if (typeof global !== 'undefined') {
  // Process polyfill
  if (!global.process) {
    global.process = require('process/browser');
  }
  
  // Buffer polyfill
  if (!global.Buffer) {
    global.Buffer = require('buffer').Buffer;
  }
  
  // Events polyfill
  if (!global.EventEmitter) {
    global.EventEmitter = require('events').EventEmitter;
  }
  
  // Stream polyfill
  if (!global.Stream) {
    global.Stream = require('readable-stream');
    global.stream = global.Stream;
  }
  
  // Crypto polyfill - disabled for now
  // if (!global.crypto) {
  //   global.crypto = require('react-native-crypto-js');
  // }
  
  // Util polyfill
  if (!global.util) {
    global.util = require('util');
  }
  
  // Set __DEV__ flag
  global.__DEV__ = __DEV__;
}
