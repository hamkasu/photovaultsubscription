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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vaultAPI } from '../services/api';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = (width - 6) / COLUMN_COUNT; // 2px gap between items
const BASE_URL = 'https://web-production-535bd.up.railway.app';

export default function VaultDetailScreen({ route, navigation }) {
  const { vaultId } = route.params;
  const [vault, setVault] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' or 'members'
  
  // Photo picker states
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [userPhotos, setUserPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [adding, setAdding] = useState(false);
  
  // Invite member states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

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

  const loadUserPhotos = async () => {
    try {
      // Load user's photos from dashboard (same as gallery)
      const response = await fetch(`${BASE_URL}/api/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      
      if (data.all_photos && data.all_photos.length > 0) {
        setUserPhotos(data.all_photos);
      } else {
        setUserPhotos([]);
        Alert.alert('No Photos', 'You need to add photos to your gallery first');
      }
    } catch (error) {
      console.error('Load photos error:', error);
      Alert.alert('Error', 'Failed to load your photos');
    }
  };

  const openPhotoPicker = () => {
    loadUserPhotos();
    setSelectedPhoto(null);
    setPhotoCaption('');
    setShowPhotoPicker(true);
  };

  const addPhotoToVault = async () => {
    if (!selectedPhoto) {
      Alert.alert('Select Photo', 'Please select a photo to add');
      return;
    }

    setAdding(true);
    try {
      const response = await vaultAPI.addPhotoToVault(vaultId, selectedPhoto.id, photoCaption);
      
      Alert.alert('Success', 'Photo added to vault successfully');
      setShowPhotoPicker(false);
      setSelectedPhoto(null);
      setPhotoCaption('');
      loadVaultDetails(); // Refresh vault
    } catch (error) {
      console.error('Add photo error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to add photo to vault');
    } finally {
      setAdding(false);
    }
  };

  const openInviteModal = () => {
    setInviteEmail('');
    setInviteRole('member');
    setShowInviteModal(true);
  };

  const inviteMemberToVault = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setInviting(true);
    try {
      const response = await vaultAPI.inviteMember(vaultId, inviteEmail.trim(), inviteRole);
      
      Alert.alert('Success', `Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      loadVaultDetails(); // Refresh vault to see pending invitations
    } catch (error) {
      console.error('Invite member error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
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
        resizeMode="cover"
      />
      
      {/* Bottom gradient overlay */}
      <View style={styles.bottomOverlay}>
        <Text style={styles.photoDate} numberOfLines={1}>
          {item.caption || formatDate(item.created_at)}
        </Text>
      </View>

      {/* Colorized badge */}
      {item.edited_url && (
        <View style={styles.enhancedBadge}>
          <Ionicons name="sparkles" size={14} color="#fff" />
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
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{vault.name}</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
          onPress={() => setActiveTab('photos')}
        >
          <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
            Photos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.tabActive]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
            Members
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'members' ? (
        <ScrollView
          style={styles.membersContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.membersList}>
            <View style={styles.membersHeader}>
              <Text style={styles.membersTitle}>Members</Text>
              <TouchableOpacity onPress={openInviteModal}>
                <Ionicons name="person-add" size={24} color="#E85D75" />
              </TouchableOpacity>
            </View>
            
            {members.length === 0 ? (
              <View style={styles.emptyMembers}>
                <Ionicons name="people-outline" size={60} color="#666" />
                <Text style={styles.emptyText}>No members yet</Text>
              </View>
            ) : (
              members.map((member) => (
                <View key={member.id}>{renderMember({ item: member })}</View>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.photosContainer}>
          {photos.length === 0 ? (
            <View style={styles.emptyPhotos}>
              <Ionicons name="images-outline" size={80} color="#666" />
              <Text style={styles.emptyText}>No photos yet</Text>
              <Text style={styles.emptySubtext}>
                Add photos to share with family members
              </Text>
            </View>
          ) : (
            <FlatList
              data={photos}
              renderItem={renderPhoto}
              keyExtractor={(item) => item.id.toString()}
              numColumns={COLUMN_COUNT}
              contentContainerStyle={styles.photoList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
          
          {/* Floating Add Button */}
          <TouchableOpacity
            style={styles.floatingAddButton}
            onPress={openPhotoPicker}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Photo Picker Modal */}
      <Modal
        visible={showPhotoPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPhotoPicker(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Photo</Text>
                  <TouchableOpacity onPress={() => setShowPhotoPicker(false)}>
                    <Ionicons name="close" size={28} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.photoPickerScroll}>
                  <View style={styles.photoPickerGrid}>
                    {userPhotos.map((photo) => (
                      <TouchableOpacity
                        key={photo.id}
                        style={[
                          styles.photoPickerItem,
                          selectedPhoto?.id === photo.id && styles.photoPickerItemSelected
                        ]}
                        onPress={() => setSelectedPhoto(photo)}
                      >
                        <Image
                          source={{ 
                            uri: `${BASE_URL}${photo.original_url}`,
                            headers: { 'Authorization': `Bearer ${authToken}` }
                          }}
                          style={styles.photoPickerImage}
                        />
                        {selectedPhoto?.id === photo.id && (
                          <View style={styles.photoPickerCheck}>
                            <Ionicons name="checkmark-circle" size={32} color="#E85D75" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TextInput
                    style={styles.captionInput}
                    placeholder="Add caption (optional)"
                    value={photoCaption}
                    onChangeText={setPhotoCaption}
                    multiline
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                  
                  <TouchableOpacity
                    style={[styles.addButton, adding && styles.addButtonDisabled]}
                    onPress={addPhotoToVault}
                    disabled={adding || !selectedPhoto}
                  >
                    {adding ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.addButtonText}>Add to Vault</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Invite Member</Text>
                  <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                    <Ionicons name="close" size={28} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inviteForm}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="member@example.com"
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Text style={styles.inputLabel}>Role</Text>
                  <View style={styles.roleSelector}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        inviteRole === 'member' && styles.roleOptionSelected
                      ]}
                      onPress={() => setInviteRole('member')}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        inviteRole === 'member' && styles.roleOptionTextSelected
                      ]}>Member</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        inviteRole === 'admin' && styles.roleOptionSelected
                      ]}
                      onPress={() => setInviteRole('admin')}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        inviteRole === 'admin' && styles.roleOptionTextSelected
                      ]}>Admin</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.inviteButton, inviting && styles.inviteButtonDisabled]}
                    onPress={inviteMemberToVault}
                    disabled={inviting || !inviteEmail.trim()}
                  >
                    {inviting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.inviteButtonText}>Send Invitation</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#000',
  },
  errorText: {
    fontSize: 18,
    color: '#999',
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
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginHorizontal: 15,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#E85D75',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  photosContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  photoList: {
    paddingBottom: 80,
  },
  photoCard: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.6, // Vertical aspect ratio like TikTok
    margin: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    paddingBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  photoDate: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  enhancedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#E85D75',
    borderRadius: 10,
    padding: 3,
  },
  emptyPhotos: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E85D75',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  membersContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  membersList: {
    padding: 20,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
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
    color: '#fff',
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
  emptyMembers: {
    alignItems: 'center',
    padding: 60,
  },
  // Photo Picker Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  photoPickerScroll: {
    maxHeight: 400,
  },
  photoPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  photoPickerItem: {
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  photoPickerItemSelected: {
    borderColor: '#E85D75',
  },
  photoPickerImage: {
    width: '100%',
    height: '100%',
  },
  photoPickerCheck: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#E85D75',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Invite Member Modal Styles
  inviteForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: '#E85D75',
    backgroundColor: '#FFF0F3',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#666',
  },
  roleOptionTextSelected: {
    color: '#E85D75',
    fontWeight: 'bold',
  },
  inviteButton: {
    backgroundColor: '#E85D75',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
