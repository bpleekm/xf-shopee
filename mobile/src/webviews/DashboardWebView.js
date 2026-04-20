/**
 * Dashboard WebView
 * 
 * Displays the web admin dashboard for overview and analytics.
 */

import React from 'react';
import BaseWebView from './BaseWebView';
import { WEB_ADMIN_URLS } from '../services/config';

const DashboardWebView = (props) => {
  const handleMessage = (message) => {
    console.log('Dashboard WebView message:', message);
    
    // Handle specific message types
    switch (message.type) {
      case 'DASHBOARD_LOADED':
        console.log('Dashboard loaded successfully');
        break;
      case 'REFRESH_DATA':
        console.log('Refresh dashboard data requested');
        break;
      default:
        console.log('Unhandled message type:', message.type);
    }
  };

  const injectedJavaScript = `
    // Dashboard-specific JavaScript
    console.log('Dashboard WebView loaded');
    
    // Notify native app that dashboard is ready
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'DASHBOARD_LOADED',
      data: { timestamp: Date.now() }
    }));
    
    // Listen for refresh events
    window.addEventListener('refreshDashboard', () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'REFRESH_DATA',
        data: { reason: 'manual_refresh' }
      }));
    });
    
    // Expose dashboard API to web admin
    window.dashboardAPI = {
      refresh: () => {
        window.dispatchEvent(new Event('refreshDashboard'));
      }
    };
  `;

  return (
    <BaseWebView
      source={{ uri: WEB_ADMIN_URLS.DASHBOARD }}
      onMessage={handleMessage}
      injectedJavaScript={injectedJavaScript}
      {...props}
    />
  );
};

export default DashboardWebView;