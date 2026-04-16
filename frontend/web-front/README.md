# XF Shopee - Web Frontend Shopping Site

This is the web frontend shopping site for the XF Shopee ERP system, built with Vue 3, Pinia, and Element Plus.

## Architecture
- **Framework**: Vue 3 (Composition API)
- **State Management**: Pinia
- **UI Library**: Element Plus
- **Routing**: Vue Router 4
- **Build Tool**: Vite

## Project Structure
```
web-front/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/         # Reusable components
│   │   └── OrderList.vue
│   ├── stores/            # Pinia stores
│   │   └── cart.js
│   ├── views/             # Page components
│   │   ├── HomeView.vue
│   │   ├── ProductsView.vue
│   │   ├── CartView.vue
│   │   └── OrdersView.vue
│   ├── router/            # Routing configuration
│   │   └── index.js
│   ├── App.vue            # Main application component
│   ├── main.js           # Application entry point
│   └── style.css         # Global styles
├── package.json          # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md            # This file
```

## Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Installation
```bash
cd frontend/web-front
npm install
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

The application will be available at `http://localhost:3001`.

## Features
- **Home Page**: Featured products and store information
- **Product Catalog**: Browse, search, and filter products
- **Shopping Cart**: Add, remove, and update cart items
- **Order Management**: View and track order history
- **Responsive Design**: Mobile-friendly interface
- **State Management**: Cart state persists across navigation

## Development Notes
This is a starter template for the XF Shopee shopping site. The actual implementation should include:
- Integration with backend API endpoints
- User authentication (optional for guest checkout)
- Payment gateway integration
- Real-time inventory updates
- Product reviews and ratings
- Wishlist functionality
- Advanced search and filtering
- Multi-language support (optional)

## API Integration
Create API service files to connect to the backend. Example:
```javascript
// src/services/api.js
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Product API
export const productApi = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  // ... other product endpoints
}

// Cart API (for logged-in users)
export const cartApi = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart/items', { productId, quantity }),
  updateCartItem: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),
  removeCartItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clearCart: () => api.delete('/cart')
}
```
