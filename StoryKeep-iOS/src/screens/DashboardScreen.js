import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { dashboardAPI, photoAPI } from '../services/api';
import api from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, photosData, userDataString, token] = await Promise.all([
        dashboardAPI.getStats(),
        photoAPI.getPhotos('all'),
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('authToken'),
      ]);

      setStats(statsData);
      setRecentPhotos(photosData.photos?.slice(0, 6) || []);
      setUserData(userDataString ? JSON.parse(userDataString) : null);
      setAuthToken(token);
    } catch (error) {
      console.error('Dashboard error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Clear all storage including biometric credentials
            await AsyncStorage.clear();
            await SecureStore.deleteItemAsync('userEmail').catch(() => {});
            await SecureStore.deleteItemAsync('userPassword').catch(() => {});
            // Navigation will be handled automatically by App.js when auth state changes
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E85D75" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{userData?.username || 'User'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle" size={40} color="#E85D75" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={28} color="#E85D75" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="images" size={32} color="#E85D75" />
          <Text style={styles.statNumber}>{stats?.total_photos || 0}</Text>
          <Text style={styles.statLabel}>Total Photos</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="sparkles" size={32} color="#E85D75" />
          <Text style={styles.statNumber}>{stats?.enhanced_photos || 0}</Text>
          <Text style={styles.statLabel}>Enhanced</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="folder" size={32} color="#E85D75" />
          <Text style={styles.statNumber}>{stats?.albums || 0}</Text>
          <Text style={styles.statLabel}>Albums</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="cloud" size={32} color="#E85D75" />
          <Text style={styles.statNumber}>
            {stats?.storage_used ? `${stats.storage_used}MB` : '0MB'}
          </Text>
          <Text style={styles.statLabel}>Storage</Text>
        </View>
      </View>

      {stats?.subscription_plan && (
        <View style={styles.subscriptionCard}>
          <Ionicons name="shield-checkmark" size={24} color="#E85D75" />
          <Text style={styles.subscriptionText}>
            {stats.subscription_plan} Plan
          </Text>
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Camera')}
        >
          <Ionicons name="camera" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Digitize Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => navigation.navigate('Gallery')}
        >
          <Ionicons name="images" size={24} color="#E85D75" />
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
            View Gallery
          </Text>
        </TouchableOpacity>
      </View>

      {/* DIAGNOSTIC SECTION */}
      {stats?.recent_photo && (
        <View style={styles.diagnosticSection}>
          <Text style={styles.sectionTitle}>🔍 Diagnostic Info</Text>
          <Text style={styles.diagnosticText}>Debug Photos Count: {stats?.debug_photos_count || 0}</Text>
          <Text style={styles.diagnosticText}>Recent Photo ID: {stats.recent_photo.id}</Text>
          <Text style={styles.diagnosticText}>Filename: {stats.recent_photo.filename}</Text>
          {stats.recent_photo.original_url && authToken && (
            <Image
              source={{ 
                uri: `https://web-production-535bd.up.railway.app${stats.recent_photo.original_url}`,
                headers: {
                  Authorization: `Bearer ${authToken}`
                }
              }}
              style={styles.diagnosticImage}
              resizeMode="contain"
            />
          )}
        </View>
      )}

      {recentPhotos.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Photos</Text>
          <View style={styles.photoGrid}>
            {recentPhotos.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoCard}
                onPress={() => navigation.navigate('PhotoDetail', { photo })}
              >
                <Image
                  source={{ uri: photo.thumbnail_url || photo.url }}
                  style={styles.photoThumbnail}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f8f8',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    marginRight: 10,
  },
  logoutButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
  },
  subscriptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E85D75',
    marginLeft: 10,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#E85D75',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E85D75',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  actionButtonTextSecondary: {
    color: '#E85D75',
  },
  diagnosticSection: {
    padding: 20,
    backgroundColor: '#FFF9E6',
    margin: 15,
    borderRadius: 10,
  },
  diagnosticText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  diagnosticImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  recentSection: {
    padding: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoCard: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
});
