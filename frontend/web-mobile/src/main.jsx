import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { ConfigProvider } from 'antd-mobile'
import zhCN from 'antd-mobile/es/locales/zh-CN'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import 'antd-mobile/es/global'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <App />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  </React.StrictMode>,
)