/**
 * Scanner WebView
 * 
 * Provides barcode/QR code scanning interface with native integration.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import BaseWebView from './BaseWebView';
import Bridge from '../native/BridgeModule';

const ScannerWebView = (props) => {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  const handleScan = async () => {
    if (scanning) return;
    
    setScanning(true);
    try {
      const result = await Bridge.scanBarcode();
      setLastResult(result);
      
      if (result.success) {
        // Add to history
        setScanHistory(prev => [result, ...prev.slice(0, 9)]);
        
        // Send result to WebView
        if (props.onScanResult) {
          props.onScanResult(result);
        }
        
        // Also post message to any WebView content
        // (if we have a WebView for displaying results)
      }
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleQRScan = async () => {
    setScanning(true);
    try {
      const result = await Bridge.scanQRCode();
      setLastResult(result);
      
      if (result.success) {
        setScanHistory(prev => [result, ...prev.slice(0, 9)]);
        if (props.onScanResult) {
          props.onScanResult(result);
        }
      }
    } catch (error) {
      console.error('QR scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
    setLastResult(null);
  };

  // If we want to use WebView for UI, we can load a scanner interface
  // For now, we'll create a native UI
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Barcode Scanner</Text>
        <Text style={styles.subtitle}>Scan product barcodes or QR codes</Text>
      </View>
      
      <View style={styles.scanArea}>
        <View style={styles.scanBox}>
          {scanning ? (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color="#1890ff" />
              <Text style={styles.scanningText}>Scanning...</Text>
            </View>
          ) : (
            <Text style={styles.scanPlaceholder}>[ Scanner Preview ]</Text>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleScan}
            disabled={scanning}
          >
            <Text style={styles.buttonText}>
              {scanning ? 'Scanning...' : 'Scan Barcode'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleQRScan}
            disabled={scanning}
          >
            <Text style={styles.buttonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {lastResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Last Scan Result:</Text>
          <View style={styles.resultBox}>
            <Text style={styles.resultData}>{lastResult.data}</Text>
            <Text style={styles.resultFormat}>Format: {lastResult.format}</Text>
            <Text style={styles.resultTime}>
              Time: {new Date(lastResult.timestamp).toLocaleTimeString()}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Navigate to product page with scanned code
              console.log('Navigate to product:', lastResult.data);
            }}
          >
            <Text style={styles.actionButtonText}>View Product</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {scanHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Scans</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>
          {scanHistory.slice(0, 5).map((scan, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyData} numberOfLines={1}>
                {scan.data}
              </Text>
              <Text style={styles.historyFormat}>{scan.format}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.note}>
        <Text style={styles.noteText}>
          • Position barcode within the frame{'\n'}
          • Ensure good lighting{'\n'}
          • Hold steady for accurate scan
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  scanArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scanBox: {
    width: 280,
    height: 200,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#1890ff',
    borderStyle: 'dashed',
  },
  scanningOverlay: {
    alignItems: 'center',
  },
  scanningText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  scanPlaceholder: {
    color: '#fff',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1890ff',
  },
  secondaryButton: {
    backgroundColor: '#52c41a',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  resultBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultData: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1890ff',
    marginBottom: 4,
  },
  resultFormat: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    color: '#ff4d4f',
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyData: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  historyFormat: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  note: {
    backgroundColor: '#e8f4ff',
    padding: 16,
    borderRadius: 8,
  },
  noteText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ScannerWebView;