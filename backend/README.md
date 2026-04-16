# XF Shopee - Backend Service

This is the backend service for the XF Shopee ERP system, built with Node.js and Express.

## Architecture
- **Framework**: Express 4.x
- **Database**: MySQL (via mysql2 driver)
- **Authentication**: JWT tokens
- **Process Manager**: PM2 (recommended for production)

## Project Structure
```
backend/
├── src/
│   └── index.js          # Main application entry point
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MySQL 8.0+

### Installation
```bash
cd backend
npm install
```

### Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=xf_shopee
JWT_SECRET=your_jwt_secret_key
```

### Running the Application
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```
Returns service health status.

### Hello World
```
GET /api/hello
```
Returns a greeting message.

### Users (Placeholder)
```
GET /api/users
```
Returns sample user data.

## Development
This is a starter template for the XF Shopee ERP system. The actual implementation should include:
- User management module
- SKU management module  
- Shopping cart module
- Order management module
- Permission control module
- Database models and migrations
- Authentication and authorization middleware

## Deployment
For production deployment, use PM2 to manage the Node.js process:
```bash
npm install -g pm2
pm2 start src/index.js --name "xf-shopee-backend"
```
