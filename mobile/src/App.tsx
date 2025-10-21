import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@store/index';
import { storage } from '@utils/storage';
import { webSocketService } from '@services/websocket';
import { LoginScreen } from '@screens/LoginScreen';
import { HomeScreen } from '@screens/HomeScreen';
import { ChatScreen } from '@screens/ChatScreen';
import { SettingsScreen } from '@screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const { user, setUser, setTokens, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      try {
        // Restore tokens and user from storage
        const [accessToken, refreshToken, storedUser] = await Promise.all([
          storage.getAccessToken(),
          storage.getRefreshToken(),
          storage.getUser(),
        ]);

        if (accessToken && refreshToken && storedUser) {
          setTokens(accessToken, refreshToken);
          setUser(storedUser);

          // Connect WebSocket
          webSocketService.connect(accessToken);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();

    return () => {
      webSocketService.disconnect();
    };
  }, [setUser, setTokens]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated && user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
