import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthStorage } from './src/storage/AuthStorage';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AuthStorage.getToken();
        setUserToken(token);
      } catch (e) {
        console.error('Auth Check Error:', e);
      } finally {
        setAuthLoading(false);
      }
    };

    checkToken();
  }, []);

  const handleLoginSuccess = (token: string) => {
    setUserToken(token);
  };

  const handleLogout = async () => {
    await AuthStorage.removeToken();
    setUserToken(null);
  };

  if (authLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0084ff" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {userToken ? (
        <HomeScreen onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#05070a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});