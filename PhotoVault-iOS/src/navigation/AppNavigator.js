/*
StoryKeep Mobile Navigation
Copyright (c) 2025 Calmic Sdn Bhd. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution,
modification, or use of this software is strictly prohibited.

Website: https://www.calmic.com.my
Email: support@calmic.com.my

CALMIC SDN BHD - "Committed to Excellence"
*/

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CameraScreen from '../screens/CameraScreen';
import GalleryScreen from '../screens/GalleryScreen';
import PhotoViewScreen from '../screens/PhotoViewScreen';
import EnhancementScreen from '../screens/EnhancementScreen';
import VaultsScreen from '../screens/VaultsScreen';

// Import services
import { initializeAuth, getAuthToken, apiService } from '../services/api';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await initializeAuth();
      const token = await getAuthToken();
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (navigation) => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await apiService.logout();
            setIsAuthenticated(false);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Dashboard' : 'Login'}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ title: 'Create Account' }}
        />
        
        {/* Main App Screens */}
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={({ navigation }) => ({
            title: 'StoryKeep',
            headerRight: () => (
              <TouchableOpacity onPress={() => handleLogout(navigation)}>
                <Ionicons name="log-out-outline" size={24} color="#fff" />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen} 
          options={{ title: 'Digitizer', headerShown: false }}
        />
        <Stack.Screen 
          name="Gallery" 
          component={GalleryScreen} 
          options={{ title: 'Gallery' }}
        />
        <Stack.Screen 
          name="PhotoView" 
          component={PhotoViewScreen} 
          options={{ title: 'Photo' }}
        />
        <Stack.Screen 
          name="Enhancement" 
          component={EnhancementScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Vaults" 
          component={VaultsScreen} 
          options={{ title: 'Family Vaults' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}