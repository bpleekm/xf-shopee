/**
 * Order Management WebView
 * 
 * Provides order processing and management functionality.
 */

import React from 'react';
import BaseWebView from './BaseWebView';
import { WEB_ADMIN_URLS } from '../services/config';

const OrderWebView = (props) => {
  const handleMessage = (message) => {
    console.log('Order WebView message:', message);
    
    switch (message.type) {
      case 'ORDER_STATUS_UPDATE':
        console.log('Order status update requested:', message.data);
        // TODO: Update order status via API
        break;
        
      case 'ORDER_DETAILS_REQUEST':
        console.log('Order details requested:', message.data);
        // TODO: Fetch order details
        break;
        
      case 'PROCESS_ORDER':
        console.log('Process order request:', message.data);
        // TODO: Process order
        break;
        
      case 'SEARCH_ORDERS':
        console.log('Search orders request:', message.data);
        // TODO: Search orders
        break;
        
      default:
        console.log('Unhandled message type:', message.type);
    }
  };

  const injectedJavaScript = `
    // Order Management-specific JavaScript
    console.log('Order Management WebView loaded');
    
    // Order management API
    window.orderAPI = {
      updateStatus: (orderId, status) => {
        return new Promise((resolve, reject) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ORDER_STATUS_UPDATE',
            data: { orderId, status }
          }));
          // Simulate success for now
          setTimeout(() => resolve({ success: true }), 500);
        });
      },
      
      getDetails: (orderId) => {
        return new Promise((resolve, reject) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ORDER_DETAILS_REQUEST',
            data: { orderId }
          }));
          // Simulate response for now
          setTimeout(() => resolve({
            id: orderId,
            status: 'processing',
            items: [],
            total: 0,
            createdAt: new Date().toISOString()
          }), 500);
        });
      },
      
      processOrder: (orderId) => {
        return new Promise((resolve, reject) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PROCESS_ORDER',
            data: { orderId }
          }));
          // Simulate success for now
          setTimeout(() => resolve({ success: true }), 500);
        });
      },
      
      searchOrders: (query) => {
        return new Promise((resolve, reject) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SEARCH_ORDERS',
            data: { query }
          }));
          // Simulate response for now
          setTimeout(() => resolve([]), 500);
        });
      }
    };
    
    // Notify that Order API is ready
    window.dispatchEvent(new Event('orderAPIReady'));
    console.log('Order API injected');
  `;

  return (
    <BaseWebView
      source={{ uri: WEB_ADMIN_URLS.ORDER_MANAGEMENT }}
      onMessage={handleMessage}
      injectedJavaScript={injectedJavaScript}
      {...props}
    />
  );
};

export default OrderWebView;