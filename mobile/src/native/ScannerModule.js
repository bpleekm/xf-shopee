/**
 * Native Scanner Module
 * 
 * Provides barcode and QR code scanning capabilities.
 */

import { NativeModules } from 'react-native';

const ScannerModule = NativeModules.ScannerModule || {
  // Mock implementation for development
  scanBarcode: () => {
    console.log('[ScannerModule] scanBarcode');
    return Promise.resolve({
      success: true,
      data: '123456789012',
      format: 'EAN_13',
      timestamp: Date.now(),
    });
  },
  scanQRCode: () => {
    console.log('[ScannerModule] scanQRCode');
    return Promise.resolve({
      success: true,
      data: 'https://xfshopee.com/product/123',
      format: 'QR_CODE',
      timestamp: Date.now(),
    });
  },
  toggleFlash: (enabled) => {
    console.log(`[ScannerModule] toggleFlash: ${enabled}`);
    return Promise.resolve(true);
  },
  hasCameraPermission: () => {
    console.log('[ScannerModule] hasCameraPermission');
    return Promise.resolve(true);
  },
  requestCameraPermission: () => {
    console.log('[ScannerModule] requestCameraPermission');
    return Promise.resolve(true);
  },
};

// Native module constants
const constants = ScannerModule.getConstants ? ScannerModule.getConstants() : {};

export default ScannerModule;
export const ScannerConstants = constants;