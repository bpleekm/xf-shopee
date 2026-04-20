/**
 * Main Application Navigator
 * 
 * Sets up the bottom tab navigation for the app.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import screens/components
import DashboardWebView from '../webviews/DashboardWebView';
import SKUWebView from '../webviews/SKUWebView';
import OrderWebView from '../webviews/OrderWebView';
import ScannerWebView from '../webviews/ScannerWebView';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'SKU') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Scanner') {
            iconName = focused ? 'scan' : 'scan-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1890ff',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#1890ff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardWebView}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="SKU" 
        component={SKUWebView}
        options={{ title: 'SKU Management' }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrderWebView}
        options={{ title: 'Order Management' }}
      />
      <Tab.Screen 
        name="Scanner" 
        component={ScannerWebView}
        options={{ title: 'Scanner' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator (for authentication flow)
const AppStack = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  
  // TODO: Implement proper authentication check
  // For now, assume user is authenticated
  const userAuthenticated = true;
  
  return (
    <Stack.Navigator>
      {userAuthenticated ? (
        <Stack.Screen 
          name="Main" 
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

// Main Navigator Container
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
};

export default AppNavigator;