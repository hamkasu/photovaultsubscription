import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vaultAPI } from '../services/api';

const BASE_URL = 'https://web-production-535bd.up.railway.app';

export default function VaultDetailScreen({ route, navigation }) {
  const { vaultId } = route.params;
  const [vault, setVault] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    loadAuthToken();
  }, []);

  useEffect(() => {
    if (authToken) {
      loadVaultDetails();
    }
  }, [authToken]);

  const loadAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setAuthToken(token);
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  };

  const loadVaultDetails = async () => {
    try {
      const response = await vaultAPI.getVaultDetail(vaultId);
      
      if (response.vault) {
        setVault(response.vault);
        setPhotos(response.photos || []);
        setMembers(response.members || []);
      } else {
        Alert.alert('Error', response.error || 'Failed to load vault details');
      }
    } catch (error) {
      console.error('Vault detail error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load vault details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVaultDetails();
  };

  const renderPhoto = ({ item }) => (
    <TouchableOpacity
      style={styles.photoCard}
      onPress={() => navigation.navigate('PhotoDetail', { photoId: item.id })}
    >
      <Image
        source={{ 
          uri: `${BASE_URL}${item.thumbnail_url || item.original_url}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }}
        style={styles.photoImage}
      />
      {item.caption && (
        <View style={styles.captionOverlay}>
          <Text style={styles.captionText} numberOfLines={2}>
            {item.caption}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMember = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Ionicons name="person" size={24} color="#E85D75" />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.username || item.email}</Text>
        <View style={styles.memberRoleBadge}>
          <Text style={styles.memberRole}>{item.role}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E85D75" />
      </View>
    );
  }

  if (!vault) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={80} color="#ccc" />
        <Text style={styles.errorText}>Failed to load vault</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadVaultDetails}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{vault.name}</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.vaultInfo}>
          <Text style={styles.description}>{vault.description}</Text>
          
          <View style={styles.vaultCodeContainer}>
            <Text style={styles.vaultCodeLabel}>Vault Code:</Text>
            <View style={styles.vaultCodeBox}>
              <Text style={styles.vaultCode}>{vault.vault_code}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="images" size={24} color="#E85D75" />
              <Text style={styles.statNumber}>{photos.length}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color="#E85D75" />
              <Text style={styles.statNumber}>{members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <TouchableOpacity>
              <Ionicons name="person-add" size={24} color="#E85D75" />
            </TouchableOpacity>
          </View>
          
          {members.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No members yet</Text>
            </View>
          ) : (
            members.map((member) => (
              <View key={member.id}>{renderMember({ item: member })}</View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <TouchableOpacity>
              <Ionicons name="add-circle" size={28} color="#E85D75" />
            </TouchableOpacity>
          </View>
          
          {photos.length === 0 ? (
            <View style={styles.emptyPhotos}>
              <Ionicons name="images-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No photos yet</Text>
              <Text style={styles.emptySubtext}>
                Add photos to share with family members
              </Text>
            </View>
          ) : (
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoGridItem}>
                  {renderPhoto({ item: photo })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E85D75',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginHorizontal: 15,
  },
  vaultInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  vaultCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  vaultCodeLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  vaultCodeBox: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  vaultCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E85D75',
    fontFamily: 'monospace',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySection: {
    padding: 20,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    color: '#999',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberRoleBadge: {
    backgroundColor: '#E85D75',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberRole: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  photoGridItem: {
    width: '50%',
    padding: 5,
  },
  photoCard: {
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  captionText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyPhotos: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
