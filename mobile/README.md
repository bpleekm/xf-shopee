# XF Shopee - Mobile App (Hybrid Architecture)

This is the mobile application for the XF Shopee ERP system, built with React Native and a Hybrid (WebView-based) architecture.

## Architecture Overview
- **Hybrid Architecture**: Native container with multiple WebViews
- **Native Components**: Storage, camera, barcode scanner, push notifications
- **Web Components**: Business logic and UI rendered in WebViews
- **Communication**: JavaScript Bridge between native and web layers

## Project Structure
```
mobile/
├── ios/                   # iOS native project files
├── android/               # Android native project files
├── web/                   # Web build output
├── src/
│   ├── native/           # Native bridge modules
│   │   └── BridgeModule.js
│   ├── components/       # React Native components
│   ├── screens/         # Native screens (optional)
│   ├── services/        # API services
│   └── App.js           # Main application
├── package.json         # Dependencies and scripts
├── index.js            # Application entry point
├── app.json            # App configuration
└── README.md           # This file
```

## Hybrid Architecture Details

### Native Layer Responsibilities
- **Storage Management**: Secure local storage for sensitive data
- **Cookie Injection**: Inject authentication cookies into WebViews
- **Device Features**: Camera, barcode scanner, push notifications
- **WebView Management**: Multiple WebViews for module isolation
- **Performance Optimization**: Caching, offline support

### Web Layer Responsibilities
- **Business Logic**: All ERP functionality (SKU management, orders, etc.)
- **UI Rendering**: Consistent with web admin/frontend
- **API Communication**: Backend API integration
- **State Management**: Application state and caching

### Communication Bridge
- **JavaScript Interface**: WebView postMessage API
- **Native Modules**: React Native NativeModules
- **Event System**: Bi-directional event communication

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- React Native CLI environment
- iOS: Xcode 14+ (for Mac)
- Android: Android Studio, JDK 11+

### Installation
```bash
cd mobile
npm install

# For iOS
cd ios && pod install && cd ..

# For Android
# Open android/ in Android Studio and sync Gradle
```

### Running the Application
```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run web version (development)
npm run web
```

## Module Isolation Strategy
Each major module runs in a separate WebView for isolation:

1. **Dashboard WebView**: Overview and analytics
2. **SKU Management WebView**: Product CRUD operations
3. **Order Processing WebView**: Order management
4. **Scanner WebView**: Barcode scanning interface
5. **Profile WebView**: User settings and info

Benefits:
- Independent loading and caching
- Memory isolation
- Module-specific error containment
- Graceful module reloading

## Native Features Implementation

### Storage Bridge
```javascript
// From web layer
window.nativeBridge.setStorage('user_token', 'abc123')

// From native layer
import BridgeModule from './src/native/BridgeModule'
await BridgeModule.setItem('user_token', 'abc123')
```

### Barcode Scanner
```javascript
// Trigger native scanner from web
window.nativeBridge.scanBarcode()

// Handle result in native
BridgeModule.scanBarcode().then(result => {
  if (result.success) {
    // Send result to webview
    webView.postMessage(JSON.stringify({
      type: 'BARCODE_SCANNED',
      data: result.data
    }))
  }
})
```

### Cookie Injection
```javascript
// Native injects cookies before loading WebView
const cookies = [
  'session_id=abc123; path=/; secure',
  'user_role=employee; path=/'
]
await BridgeModule.injectCookies(cookies)
```

## Development Guidelines

### WebView Communication Protocol
All messages between native and web use JSON format:
```json
{
  "type": "ACTION_TYPE",
  "data": {},
  "timestamp": 1234567890
}
```

### Error Handling
- WebView errors are captured natively
- Network failures trigger offline mode
- Module crashes don't affect other modules

### Performance Optimization
- WebView preloading for frequently used modules
- Cache static assets locally
- Lazy module loading
- Background synchronization

## Deployment

### App Store Submission
1. Build production bundles for iOS and Android
2. Configure app signing and provisioning
3. Submit to Apple App Store and Google Play Store
4. Configure backend CORS for mobile domains

### OTA Updates (Optional)
Consider CodePush for over-the-air updates to web content without app store submission.

## Security Considerations
- Validate all WebView messages
- Sanitize web content
- Secure storage for sensitive data
- HTTPS for all web content
- Certificate pinning for backend API
