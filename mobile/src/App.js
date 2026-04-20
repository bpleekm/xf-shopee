import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import AppNavigator from './navigation/AppNavigator';

// Ignore specific warnings (optional)
LogBox.ignoreLogs([
  'Remote debugger',
  'Require cycle:',
]);

const App = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <AppNavigator />
    </>
  );
};

export default App;

export default App;