# XF Shopee - Mobile H5 Frontend

This is the mobile H5 frontend for the XF Shopee ERP system, built with React, React Router, and Ant Design Mobile. It provides the same pages as the mobile native app and can be accessed via `xfbh/mobile/index.html`.

## Architecture
- **Framework**: React 18
- **UI Library**: Ant Design Mobile
- **Routing**: React Router DOM 6
- **State Management**: Context API + Local Storage
- **Build Tool**: Vite

## URL Structure
- Development: `http://localhost:3003`
- Production: `http://a.b.c/xfbh/mobile/index.html`
- All pages follow the pattern: `xfbh/mobile/*`

## Project Structure
```
web-mobile/
├── public/
│   ├── index.html          # HTML template
│   └── vite.svg            # Favicon
├── src/
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   │   ├── DashboardPage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── OrdersPage.jsx
│   │   ├── ScannerPage.jsx
│   │   └── ProfilePage.jsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx
│   ├── services/          # API services
│   │   └── api.js
│   ├── utils/             # Utility functions
│   ├── assets/            # Static assets
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles
├── package.json          # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── .env.example         # Environment variables template
└── README.md            # This file
```

## Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Installation
```bash
cd frontend/web-mobile
npm install
```

### Environment Configuration
```bash
cp .env.example .env
# Edit .env file as needed
```

### Running the Application
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:3003`.

## Features

### Core Pages
1. **Dashboard**: Overview and quick actions
2. **Products**: Browse, search, and manage products
3. **Orders**: View and process orders
4. **Scanner**: Barcode/QR code scanning interface
5. **Profile**: User settings and information

### Mobile-Optimized Features
- **Touch-friendly UI**: Large touch targets, swipe gestures
- **Responsive Design**: Adapts to various screen sizes
- **Offline Support**: Cached data for offline access
- **Mobile Gestures**: Swipe to refresh, pull to load
- **Camera Integration**: Photo upload and barcode scanning

### Authentication
- JWT-based authentication
- Persistent login sessions
- Role-based permissions
- Automatic token refresh

### API Integration
- Connects to backend API via `/xfbh/api` prefix
- Axios with request/response interceptors
- Error handling and retry logic
- Loading states and optimistic updates

## Deployment

### Production Build
```bash
npm run build
```

The build output will be in the `dist/` directory, which should be served from the `/xfbh/mobile/` path.

### Nginx Configuration
```
location /xfbh/mobile/ {
    alias /path/to/web-mobile/dist/;
    try_files $uri $uri/ /xfbh/mobile/index.html;
    index index.html;
}

location /xfbh/api/ {
    proxy_pass http://backend-api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Development Guidelines

### Component Structure
- Use functional components with hooks
- Follow mobile-first design principles
- Implement proper loading and error states
- Use Ant Design Mobile components when possible

### State Management
- Use Context API for global state (auth, theme, etc.)
- Use local state for component-specific data
- Persist important state to localStorage
- Implement proper state cleanup

### Performance Optimization
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Minimize bundle size
- Implement virtual lists for long lists

### Testing
- Unit tests with Jest and React Testing Library
- E2E tests with Cypress or Playwright
- Mobile device testing with browser devtools

## Integration with Native App

This H5 application can be embedded in the React Native mobile app via WebView:

```javascript
// React Native WebView integration
<WebView
  source={{ uri: 'http://a.b.c/xfbh/mobile/index.html' }}
  injectedJavaScript={injectionCode}
  onMessage={handleWebViewMessage}
/>
```

### Bridge Communication
- Use `window.postMessage` for web-to-native communication
- Use `WebView.injectJavaScript` for native-to-web communication
- Implement secure message validation

## Browser Support
- Chrome 80+ (recommended)
- Safari 12+
- Firefox 75+
- Edge 80+

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure backend CORS configuration includes mobile domain
2. **Routing Issues**: Verify base path configuration in vite.config.js
3. **API Connection**: Check API base URL in environment variables
4. **Build Errors**: Update dependencies and clear node_modules cache

### Debugging
- Enable debug mode with `VITE_DEBUG=true`
- Check browser developer tools
- Monitor network requests
- Inspect localStorage and sessionStorage

## Related Modules
- **Web Frontend (Shopping)**: `frontend/web-front/`
- **Web Admin (Management)**: `frontend/web-admin/`
- **Mobile Native App**: `mobile/`
- **Backend API**: `backend/`

## License
See project root LICENSE file.

---

*Last Updated: April 2026*