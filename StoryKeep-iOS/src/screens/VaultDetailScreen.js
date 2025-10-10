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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vaultAPI } from '../services/api';

export default function VaultDetailScreen({ route, navigation }) {
  const { vault: initialVault } = route.params;
  const [vault, setVault] = useState(initialVault);
  const [photos, setPhotos] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVaultDetails();
  }, []);

  const loadVaultDetails = async () => {
    try {
      const response = await vaultAPI.getVaultDetail(vault.id);
      setVault(response.vault);
      setPhotos(response.photos || []);
      setMembers(response.members || []);
    } catch (error) {
      console.error('Vault detail error:', error);
      Alert.alert('Error', 'Failed to load vault details');
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
      onPress={() => navigation.navigate('PhotoDetail', { photo: item })}
    >
      <Image
        source={{ uri: item.thumbnail_url || item.url }}
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
        <Text style={styles.memberRole}>{item.role}</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{vault.name}</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.vaultInfo}>
              <Text style={styles.description}>{vault.description}</Text>
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{photos.length}</Text>
                  <Text style={styles.statLabel}>Photos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{members.length}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Members</Text>
              {members.map((member) => (
                <View key={member.id}>{renderMember({ item: member })}</View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <TouchableOpacity>
                  <Ionicons name="add-circle" size={28} color="#E85D75" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.photoList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyPhotos}>
            <Ionicons name="images-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No photos yet</Text>
          </View>
        }
      />
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
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  photoList: {
    padding: 10,
  },
  photoCard: {
    flex: 1,
    margin: 5,
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
});
