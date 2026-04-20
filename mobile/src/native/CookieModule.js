/**
 * Native Cookie Module
 * 
 * Provides cookie injection and management for WebViews.
 */

import { NativeModules } from 'react-native';

const CookieModule = NativeModules.CookieModule || {
  // Mock implementation for development
  injectCookies: (cookies) => {
    console.log(`[CookieModule] injectCookies: ${JSON.stringify(cookies)}`);
    return Promise.resolve(true);
  },
  getCookies: (domain) => {
    console.log(`[CookieModule] getCookies for domain: ${domain}`);
    return Promise.resolve([]);
  },
  clearCookies: () => {
    console.log('[CookieModule] clearCookies');
    return Promise.resolve(true);
  },
  setCookie: (cookie) => {
    console.log(`[CookieModule] setCookie: ${cookie}`);
    return Promise.resolve(true);
  },
  getCookie: (name) => {
    console.log(`[CookieModule] getCookie: ${name}`);
    return Promise.resolve(null);
  },
};

// Native module constants
const constants = CookieModule.getConstants ? CookieModule.getConstants() : {};

export default CookieModule;
export const CookieConstants = constants;