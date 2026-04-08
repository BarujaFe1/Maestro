import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native';

import { AuthProvider } from './src/context/AuthContext';
import { OperationalProvider } from './src/context/OperationalContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { installGlobalErrorHandlers } from './src/utils/errorHandler';
import { installConsoleCapture } from './src/utils/logger';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';

function ThemedNav() {
  const { theme } = useTheme();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.bg,
      card: theme.colors.card,
      border: theme.colors.border,
      text: theme.colors.text,
      primary: theme.colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    TextInput.defaultProps = TextInput.defaultProps || {};
    if (!TextInput.defaultProps.placeholderTextColor) {
      TextInput.defaultProps.placeholderTextColor = '#6b7280';
    }
    if (__DEV__) installConsoleCapture();
    installGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <OperationalProvider>
            <ThemedNav />
          </OperationalProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
