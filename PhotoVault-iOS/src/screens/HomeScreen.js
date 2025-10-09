import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';
import UploadQueueService from '../services/UploadQueueService';

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
    
    const unsubscribe = UploadQueueService.subscribe(() => {
      loadQueueStats();
    });

    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      const [dashboardData, profile] = await Promise.all([
        ApiService.getDashboard(),
        ApiService.getProfile(),
      ]);
      
      setStats(dashboardData.stats);
      setUser(profile.user);
      
      await loadQueueStats();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadQueueStats = async () => {
    try {
      const stats = await UploadQueueService.getStats();
      setQueueStats(stats);
    } catch (error) {
      console.error('Error loading queue stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await ApiService.logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>StoryKeep Digitizer</Text>
          {user && <Text style={styles.subtitle}>Welcome, {user.username}</Text>}
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="images-outline" size={32} color="#007AFF" />
            <Text style={styles.statValue}>{stats?.total_photos || 0}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="albums-outline" size={32} color="#34C759" />
            <Text style={styles.statValue}>{stats?.albums || 0}</Text>
            <Text style={styles.statLabel}>Albums</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="cloud-outline" size={32} color="#FF9500" />
            <Text style={styles.statValue}>{stats?.storage_used || '0 MB'}</Text>
            <Text style={styles.statLabel}>Storage</Text>
          </View>
        </View>

        {queueStats && queueStats.total > 0 && (
          <View style={styles.queueCard}>
            <View style={styles.queueHeader}>
              <Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />
              <Text style={styles.queueTitle}>Upload Queue</Text>
            </View>
            <View style={styles.queueStats}>
              <View style={styles.queueStat}>
                <Text style={styles.queueValue}>{queueStats.pending}</Text>
                <Text style={styles.queueLabel}>Pending</Text>
              </View>
              <View style={styles.queueStat}>
                <Text style={styles.queueValue}>{queueStats.uploading}</Text>
                <Text style={styles.queueLabel}>Uploading</Text>
              </View>
              <View style={styles.queueStat}>
                <Text style={styles.queueValue}>{queueStats.completed}</Text>
                <Text style={styles.queueLabel}>Done</Text>
              </View>
              <View style={styles.queueStat}>
                <Text style={[styles.queueValue, queueStats.failed > 0 && styles.queueValueError]}>
                  {queueStats.failed}
                </Text>
                <Text style={styles.queueLabel}>Failed</Text>
              </View>
            </View>
            {queueStats.failed > 0 && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => UploadQueueService.retryFailed()}
              >
                <Text style={styles.retryButtonText}>Retry Failed</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="camera" size={32} color="#fff" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Digitalize Photos</Text>
              <Text style={styles.actionDescription}>
                Use your camera to capture and digitalize physical photos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              UploadQueueService.processQueue();
              Alert.alert('Upload Queue', 'Processing upload queue...');
            }}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#34C759' }]}>
              <Ionicons name="cloud-upload" size={32} color="#fff" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Process Upload Queue</Text>
              <Text style={styles.actionDescription}>
                Upload pending photos to the cloud
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  queueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  queueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  queueStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  queueStat: {
    alignItems: 'center',
  },
  queueValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  queueValueError: {
    color: '#FF3B30',
  },
  queueLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#666',
  },
});
