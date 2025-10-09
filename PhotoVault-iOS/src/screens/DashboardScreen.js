import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState({
    username: 'Loading...',
    subscription: 'Free'
  });
  const [stats, setStats] = useState({
    photos: 0,
    albums: 0,
    storage: '0 MB'
  });

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const profile = await apiService.getProfile();
      console.log('Profile response:', profile);
      setUser({
        username: profile.username || profile.user?.username || 'User',
        subscription: profile.subscription_plan || profile.user?.subscription_plan || 'Free'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const data = await apiService.getDashboard();
      console.log('Dashboard response:', data);
      setStats({
        photos: data.stats?.total_photos || data.total_photos || 0,
        albums: data.stats?.total_albums || data.total_albums || 0,
        storage: data.stats?.storage_used || data.storage_used || '0 MB'
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data);
    }
  };
  const menuItems = [
    {
      id: 'camera',
      title: 'Digitizer',
      description: 'Auto-extract detected photos',
      icon: 'camera',
      color: '#007AFF',
      onPress: () => navigation.navigate('Camera'),
    },
    {
      id: 'gallery',
      title: 'Gallery',
      description: 'View your photos',
      icon: 'images',
      color: '#34C759',
      onPress: () => navigation.navigate('Gallery'),
    },
    {
      id: 'upload',
      title: 'Upload',
      description: 'Upload from device',
      icon: 'cloud-upload',
      color: '#FF9500',
      onPress: () => handleUploadFromDevice(),
    },
    {
      id: 'vaults',
      title: 'Family Vaults',
      description: 'Share photos with family',
      icon: 'albums',
      color: '#AF52DE',
      onPress: () => navigation.navigate('Vaults'),
    },
  ];

  const handleUploadFromDevice = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'StoryKeep needs access to your photo library to upload photos.'
        );
        return;
      }

      // Launch image picker with cropping enabled
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setIsUploading(true);
      
      const asset = result.assets[0];
      
      // Upload the photo
      const metadata = {
        source: 'gallery',
        timestamp: new Date().toISOString(),
      };

      await apiService.uploadCameraPhoto(asset.uri, metadata);
      
      // Refresh dashboard stats
      await fetchDashboardData();

      Alert.alert(
        'Success',
        'Photo uploaded successfully!',
        [
          {
            text: 'View Gallery',
            onPress: () => navigation.navigate('Gallery'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed', 
        'Failed to upload photo. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem, 
        isUploading && item.id === 'upload' && styles.menuItemDisabled
      ]}
      onPress={item.onPress}
      disabled={isUploading && item.id === 'upload'}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={30} color="#fff" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>
          {isUploading && item.id === 'upload' ? 'Uploading...' : item.title}
        </Text>
        <Text style={styles.menuDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/calmic-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appTitle}>StoryKeep</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Welcome, {user.username}</Text>
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionText}>{user.subscription} Plan</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map(renderMenuItem)}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.photos}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.albums}</Text>
            <Text style={styles.statLabel}>Albums</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.storage}</Text>
            <Text style={styles.statLabel}>Storage</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
  },
  subscriptionBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  subscriptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});