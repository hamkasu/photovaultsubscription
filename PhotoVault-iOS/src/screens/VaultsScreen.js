import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';

export default function VaultsScreen({ navigation }) {
  const [vaults, setVaults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await apiService.getVaults();
      setVaults(response.vaults || []);
    } catch (error) {
      console.error('Error loading vaults:', error);
      Alert.alert('Error', 'Failed to load family vaults');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleJoinVault = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setIsJoining(true);
    try {
      const response = await apiService.joinVault(inviteCode.trim());
      
      if (response.success) {
        Alert.alert('Success', 'Successfully joined the vault!');
        setShowJoinModal(false);
        setInviteCode('');
        loadVaults();
      } else {
        Alert.alert('Error', response.error || 'Failed to join vault');
      }
    } catch (error) {
      console.error('Join vault error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to join vault');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateVault = () => {
    // Navigate to create vault screen (to be implemented)
    Alert.alert('Coming Soon', 'Vault creation will be available in the next update!');
  };

  const renderVault = ({ item }) => (
    <TouchableOpacity
      style={styles.vaultCard}
      onPress={() => Alert.alert('Coming Soon', 'Vault detail view will be available in the next update!')}
    >
      <View style={styles.vaultIconContainer}>
        <Ionicons name="albums" size={40} color="#007AFF" />
      </View>
      <View style={styles.vaultInfo}>
        <Text style={styles.vaultName}>{item.name}</Text>
        <Text style={styles.vaultDescription}>{item.description || 'No description'}</Text>
        <View style={styles.vaultStats}>
          <View style={styles.statItem}>
            <Ionicons name="images" size={14} color="#666" />
            <Text style={styles.statText}>{item.photo_count || 0} photos</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people" size={14} color="#666" />
            <Text style={styles.statText}>{item.member_count || 0} members</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="albums-outline" size={60} color="#666" />
      <Text style={styles.emptyText}>No Family Vaults Yet</Text>
      <Text style={styles.emptySubtext}>
        Create a vault to share photos with family and friends
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateVault}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.createButtonText}>Create Vault</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family Vaults</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowJoinModal(true)}
          >
            <Ionicons name="enter" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCreateVault}
          >
            <Ionicons name="add-circle" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && vaults.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={vaults}
          renderItem={renderVault}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={vaults.length === 0 ? styles.emptyList : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadVaults(true)}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Join Vault Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Family Vault</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Enter the invite code you received to join a family vault
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter invite code"
              placeholderTextColor="#666"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            <TouchableOpacity
              style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
              onPress={handleJoinVault}
              disabled={isJoining}
            >
              <Text style={styles.joinButtonText}>
                {isJoining ? 'Joining...' : 'Join Vault'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  emptyList: {
    flexGrow: 1,
  },
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  vaultIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
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
    color: '#fff',
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
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    width: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
