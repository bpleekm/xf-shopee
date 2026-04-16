# XF Shopee - Web Admin Dashboard

This is the web admin dashboard for the XF Shopee ERP system, built with React and Ant Design.

## Architecture
- **Framework**: React 18
- **UI Library**: Ant Design 5
- **Routing**: React Router 6
- **HTTP Client**: Axios

## Project Structure
```
web-admin/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.js             # Main application component
│   ├── App.css            # Application styles
│   ├── index.js           # Application entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Installation
```bash
cd frontend/web-admin
npm install
```

### Running the Application
```bash
# Development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

The application will be available at `http://localhost:3000` (or another port if 3000 is busy).

## Features
- **Dashboard**: Overview of key metrics (orders, revenue, users, SKU count)
- **Navigation**: Sidebar with access to all ERP modules
- **Responsive Design**: Works on desktop and tablet devices
- **Quick Actions**: Cards for common administrative tasks

## Development Notes
This is a starter template for the XF Shopee ERP admin dashboard. The actual implementation should include:
- Integration with backend API endpoints
- User authentication and session management
- Complete CRUD interfaces for:
  - User management (admin only)
  - SKU management
  - Shopping cart management
  - Order processing
- Role-based access control
- Real-time notifications
- Data visualization and reporting

## API Integration
Update the `src/services/api.js` file (to be created) to connect to the backend API. Example:
```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```
