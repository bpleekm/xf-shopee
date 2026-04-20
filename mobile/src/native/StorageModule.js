/**
 * Native Storage Module
 * 
 * Provides secure storage functionality for sensitive data.
 * This is the JavaScript interface for the native module.
 */

import { NativeModules } from 'react-native';

const StorageModule = NativeModules.StorageModule || {
  // Mock implementation for development
  setItem: (key, value) => {
    console.log(`[StorageModule] setItem: ${key}`);
    return Promise.resolve(true);
  },
  getItem: (key) => {
    console.log(`[StorageModule] getItem: ${key}`);
    return Promise.resolve(null);
  },
  removeItem: (key) => {
    console.log(`[StorageModule] removeItem: ${key}`);
    return Promise.resolve(true);
  },
  clear: () => {
    console.log('[StorageModule] clear');
    return Promise.resolve(true);
  },
  getMultiple: (keys) => {
    console.log(`[StorageModule] getMultiple: ${JSON.stringify(keys)}`);
    return Promise.resolve({});
  },
  setMultiple: (items) => {
    console.log(`[StorageModule] setMultiple: ${JSON.stringify(items)}`);
    return Promise.resolve(true);
  },
};

// Native module constants
const constants = StorageModule.getConstants ? StorageModule.getConstants() : {};

export default StorageModule;
export const StorageConstants = constants;