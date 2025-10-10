import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vaultAPI } from '../services/api';

export default function FamilyVaultsScreen({ navigation }) {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async () => {
    try {
      const response = await vaultAPI.getVaults();
      setVaults(response.vaults || []);
    } catch (error) {
      console.error('Vaults error:', error);
      Alert.alert('Error', 'Failed to load family vaults');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVaults();
  };

  const renderVault = ({ item }) => (
    <TouchableOpacity
      style={styles.vaultCard}
      onPress={() => navigation.navigate('VaultDetail', { vault: item })}
    >
      <View style={styles.vaultIcon}>
        <Ionicons name="people" size={32} color="#E85D75" />
      </View>
      <View style={styles.vaultInfo}>
        <Text style={styles.vaultName}>{item.name}</Text>
        <Text style={styles.vaultDescription} numberOfLines={2}>
          {item.description || 'No description'}
        </Text>
        <View style={styles.vaultStats}>
          <View style={styles.stat}>
            <Ionicons name="images" size={16} color="#666" />
            <Text style={styles.statText}>{item.photos_count || 0} photos</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.statText}>{item.members_count || 0} members</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
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
        <Text style={styles.title}>Family Vaults</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={32} color="#E85D75" />
        </TouchableOpacity>
      </View>

      {vaults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No family vaults yet</Text>
          <Text style={styles.emptySubtext}>
            Create or join a vault to share photos with family
          </Text>
          <TouchableOpacity style={styles.createButton}>
            <Text style={styles.createButtonText}>Create Vault</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vaults}
          renderItem={renderVault}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.vaultList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 5,
  },
  vaultList: {
    padding: 15,
  },
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  vaultIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  vaultInfo: {
    flex: 1,
  },
  vaultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vaultDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  vaultStats: {
    flexDirection: 'row',
    gap: 15,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#E85D75',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
