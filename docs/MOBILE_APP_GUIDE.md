# StoryKeep Mobile App - Technical Guide

## Overview

StoryKeep is the mobile companion to PhotoVault, built with React Native and Expo. It provides a native iOS experience for photo digitization, enhancement, and family vault management.

## Technology Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation 6
- **State Management**: React Hooks + Context API
- **HTTP Client**: Axios
- **Local Storage**: AsyncStorage + SecureStore
- **Camera**: expo-camera v17
- **Image Processing**: expo-image-manipulator
- **Authentication**: JWT with biometric support

## Project Structure

```
StoryKeep-iOS/
├── App.js                    # Root component with navigation
├── app.json                  # Expo configuration
├── package.json              # Dependencies
├── src/
│   ├── screens/             # Screen components
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── CameraScreen.js
│   │   ├── GalleryScreen.js
│   │   ├── PhotoDetailScreen.js
│   │   ├── FamilyVaultScreen.js
│   │   ├── VaultDetailScreen.js
│   │   ├── ProfileScreen.js
│   │   └── SettingsScreen.js
│   ├── components/          # Reusable components
│   │   ├── PhotoCard.js
│   │   ├── VaultCard.js
│   │   └── LoadingSpinner.js
│   ├── services/            # Business logic
│   │   ├── api.js          # API client
│   │   ├── authService.js  # Authentication
│   │   ├── uploadQueue.js  # Offline uploads
│   │   └── storage.js      # Local storage
│   ├── utils/              # Helper functions
│   │   ├── imageProcessor.js
│   │   └── validators.js
│   └── assets/             # Images, fonts, icons
└── ios/                    # Native iOS code (managed by Expo)
```

## Key Features Implementation

### 1. Authentication

#### JWT-Based Authentication

```javascript
// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://web-production-535bd.up.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

#### Biometric Login

```javascript
// src/services/authService.js
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export const enableBiometricLogin = async (email, password) => {
  // Check biometric support
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (!hasHardware || !isEnrolled) {
    return { success: false, error: 'Biometric not available' };
  }
  
  // Store credentials securely
  await SecureStore.setItemAsync('biometric_email', email);
  await SecureStore.setItemAsync('biometric_password', password);
  await AsyncStorage.setItem('biometric_enabled', 'true');
  
  return { success: true };
};

export const loginWithBiometric = async () => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Login to StoryKeep',
  });
  
  if (result.success) {
    const email = await SecureStore.getItemAsync('biometric_email');
    const password = await SecureStore.getItemAsync('biometric_password');
    
    // Login with stored credentials
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  }
  
  return null;
};
```

### 2. Smart Camera

#### Camera Component with Edge Detection

```javascript
// src/screens/CameraScreen.js
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';

export default function CameraScreen() {
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const capturePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });
      
      // Process and upload
      await processAndUpload(photo);
    }
  };

  return (
    <CameraView
      ref={cameraRef}
      facing={facing}
      flash={flash}
      style={styles.camera}
    >
      {/* Camera controls */}
      <TouchableOpacity onPress={capturePhoto}>
        <Text>Capture</Text>
      </TouchableOpacity>
    </CameraView>
  );
}
```

#### Photo Detection and Extraction

```javascript
// src/services/api.js
export const detectAndExtractPhotos = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  });

  const response = await api.post('/api/detect-and-extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
```

### 3. Image Processing

#### Local Image Enhancement

```javascript
// src/utils/imageProcessor.js
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const enhanceImage = async (imageUri, settings) => {
  const actions = [];
  
  // Apply brightness
  if (settings.brightness !== 1.0) {
    actions.push({ brightness: settings.brightness });
  }
  
  // Apply contrast
  if (settings.contrast !== 1.0) {
    actions.push({ contrast: settings.contrast });
  }
  
  // Resize if too large
  actions.push({ resize: { width: 2048 } });
  
  const result = await manipulateAsync(
    imageUri,
    actions,
    { compress: 0.8, format: SaveFormat.JPEG }
  );
  
  return result.uri;
};
```

#### Image Compression

```javascript
export const compressImage = async (imageUri, quality = 0.7) => {
  const result = await manipulateAsync(
    imageUri,
    [{ resize: { width: 1920 } }],
    { compress: quality, format: SaveFormat.JPEG }
  );
  
  return result.uri;
};
```

### 4. Offline Support

#### Upload Queue System

```javascript
// src/services/uploadQueue.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class UploadQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.init();
  }

  async init() {
    // Load queue from storage
    const stored = await AsyncStorage.getItem('upload_queue');
    if (stored) {
      this.queue = JSON.parse(stored);
    }
    
    // Listen for network changes
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isProcessing) {
        this.processQueue();
      }
    });
  }

  async addToQueue(photo) {
    const item = {
      id: Date.now(),
      photo,
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    
    this.queue.push(item);
    await this.saveQueue();
    
    // Try to process immediately
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      this.isProcessing = false;
      return;
    }
    
    const pending = this.queue.filter(item => item.status === 'pending');
    
    for (const item of pending) {
      try {
        await this.uploadPhoto(item.photo);
        item.status = 'completed';
      } catch (error) {
        item.attempts++;
        if (item.attempts >= 3) {
          item.status = 'failed';
        }
      }
      
      await this.saveQueue();
    }
    
    // Clean up completed items
    this.queue = this.queue.filter(item => item.status !== 'completed');
    await this.saveQueue();
    
    this.isProcessing = false;
  }

  async uploadPhoto(photo) {
    const formData = new FormData();
    formData.append('file', {
      uri: photo.uri,
      type: 'image/jpeg',
      name: photo.filename,
    });

    const response = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  }

  async saveQueue() {
    await AsyncStorage.setItem('upload_queue', JSON.stringify(this.queue));
  }
}

export default new UploadQueue();
```

### 5. Gallery Management

#### Photo Gallery with Filtering

```javascript
// src/screens/GalleryScreen.js
import React, { useState, useEffect } from 'react';
import { FlatList, View, Image, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function GalleryScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [filter, page]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get('/api/photos', {
        params: { filter, page, per_page: 20 },
      });
      
      if (page === 1) {
        setPhotos(response.data.photos);
      } else {
        setPhotos([...photos, ...response.data.photos]);
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPhoto = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PhotoDetail', { photo: item })}
    >
      <Image
        source={{
          uri: `${api.defaults.baseURL}${item.original_url}`,
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem('authToken')}`,
          },
        }}
        style={styles.thumbnail}
      />
    </TouchableOpacity>
  );

  return (
    <View>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        onEndReached={() => setPage(page + 1)}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}
```

### 6. Family Vaults

#### Vault List and Management

```javascript
// src/screens/FamilyVaultScreen.js
export default function FamilyVaultScreen({ navigation }) {
  const [vaults, setVaults] = useState([]);

  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async () => {
    try {
      const response = await api.get('/api/family/vaults');
      setVaults(response.data.vaults);
    } catch (error) {
      Alert.alert('Error', 'Failed to load vaults');
    }
  };

  const createVault = async (name, description) => {
    try {
      await api.post('/api/family/vaults', { name, description });
      loadVaults();
    } catch (error) {
      Alert.alert('Error', 'Failed to create vault');
    }
  };

  return (
    <View>
      <FlatList
        data={vaults}
        renderItem={({ item }) => (
          <VaultCard
            vault={item}
            onPress={() => navigation.navigate('VaultDetail', { vaultId: item.id })}
          />
        )}
      />
    </View>
  );
}
```

## Navigation Structure

```javascript
// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Gallery" component={GalleryScreen} />
      <Tab.Screen name="Vaults" component={FamilyVaultScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="PhotoDetail" component={PhotoDetailScreen} />
        <Stack.Screen name="VaultDetail" component={VaultDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## State Management

### Auth Context

```javascript
// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const response = await api.get('/api/auth/profile');
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    await AsyncStorage.setItem('authToken', response.data.token);
    setUser(response.data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await SecureStore.deleteItemAsync('biometric_email');
    await SecureStore.deleteItemAsync('biometric_password');
    await AsyncStorage.removeItem('biometric_enabled');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Performance Optimization

### 1. Image Lazy Loading

```javascript
import { Image } from 'react-native';

<Image
  source={{ uri: imageUrl }}
  progressiveRenderingEnabled
  resizeMode="cover"
  defaultSource={require('../assets/placeholder.png')}
/>
```

### 2. List Optimization

```javascript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id.toString()}
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 3. Memoization

```javascript
import { memo, useMemo, useCallback } from 'react';

const PhotoCard = memo(({ photo, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(photo);
  }, [photo, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Image source={{ uri: photo.thumbnail_url }} />
    </TouchableOpacity>
  );
});
```

## Testing

### Unit Tests

```javascript
// __tests__/authService.test.js
import { login, logout } from '../src/services/authService';

describe('Authentication Service', () => {
  test('login stores token', async () => {
    const result = await login('test@example.com', 'password');
    expect(result.success).toBe(true);
    const token = await AsyncStorage.getItem('authToken');
    expect(token).toBeTruthy();
  });

  test('logout clears token', async () => {
    await logout();
    const token = await AsyncStorage.getItem('authToken');
    expect(token).toBeNull();
  });
});
```

### Integration Tests

```javascript
// __tests__/photoUpload.test.js
import { uploadPhoto } from '../src/services/api';

describe('Photo Upload', () => {
  test('uploads photo successfully', async () => {
    const photo = { uri: 'file://test.jpg' };
    const result = await uploadPhoto(photo);
    expect(result.success).toBe(true);
    expect(result.photo).toBeDefined();
  });
});
```

## Deployment

### Development Build

```bash
npm install
npx expo start --tunnel
```

### Production Build

```bash
# iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Environment Configuration

```javascript
// app.json
{
  "expo": {
    "name": "StoryKeep",
    "slug": "storykeep",
    "version": "1.0.0",
    "extra": {
      "apiUrl": process.env.API_URL,
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

**Camera not working:**
- Check permissions in Info.plist
- Verify camera permissions granted

**Images not loading:**
- Verify JWT token in headers
- Check network connectivity
- Verify BASE_URL configuration

**Upload failures:**
- Check file size limits
- Verify network connection
- Check upload queue status

## Best Practices

1. **Always use JWT tokens for API requests**
2. **Implement offline support for critical features**
3. **Compress images before upload**
4. **Use secure storage for sensitive data**
5. **Implement proper error handling**
6. **Test on real devices**
7. **Monitor app performance**
8. **Keep dependencies updated**
