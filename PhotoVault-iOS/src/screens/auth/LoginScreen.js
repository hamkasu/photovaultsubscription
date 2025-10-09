/*
StoryKeep Mobile Login Screen
Copyright (c) 2025 Calmic Sdn Bhd. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution,
modification, or use of this software is strictly prohibited.

Website: https://www.calmic.com.my
Email: support@calmic.com.my

CALMIC SDN BHD - "Committed to Excellence"
*/

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { apiService } from '../../services/api';

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const savedCreds = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    
    if (compatible && enrolled && savedCreds) {
      setBiometricAvailable(true);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Face ID',
        fallbackLabel: 'Use password',
      });

      if (biometricAuth.success) {
        const credentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
        if (credentials) {
          const { username: savedUsername, password: savedPassword } = JSON.parse(credentials);
          setIsLoading(true);
          try {
            await apiService.login(savedUsername, savedPassword);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Dashboard' }],
            });
          } catch (error) {
            console.error('Biometric login error:', error);
            Alert.alert('Login Failed', 'Please try logging in manually.');
          } finally {
            setIsLoading(false);
          }
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
    }
  };

  const saveBiometricCredentials = async (username, password) => {
    const credentials = JSON.stringify({ username, password });
    await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, credentials);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.login(username.trim(), password);
      
      // Ask to save credentials for biometric login
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (compatible && enrolled) {
        Alert.alert(
          'Enable Face ID',
          'Would you like to use Face ID for future logins?',
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                await saveBiometricCredentials(username.trim(), password);
                setBiometricAvailable(true);
              },
            },
          ]
        );
      }
      
      // Navigate to dashboard on successful login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      
      if (error.response) {
        // Server responded with error
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password. Please try again.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = 'Login failed. Please try again later.';
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (error.message) {
        // Something else happened
        errorMessage = error.message;
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact support@calmic.com.my to reset your password.',
      [{ text: 'OK' }]
    );
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>StoryKeep</Text>
          </View>
          <Text style={styles.subtitle}>Save Your Family Stories</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {biometricAvailable && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
            >
              <Ionicons name="finger-print" size={24} color="#007AFF" />
              <Text style={styles.biometricButtonText}>Login with Face ID</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  passwordInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    paddingRight: 50,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  biometricButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 10,
  },
  registerButton: {
    alignItems: 'center',
    padding: 15,
  },
  registerButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
