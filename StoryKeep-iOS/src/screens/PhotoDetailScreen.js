import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { photoAPI, voiceMemoAPI } from '../services/api';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://web-production-535bd.up.railway.app';

export default function PhotoDetailScreen({ route, navigation }) {
  const { photo: initialPhoto } = route.params;
  const [photo, setPhoto] = useState(initialPhoto);
  const [showOriginal, setShowOriginal] = useState(true);
  const [aiMetadata, setAIMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = await AsyncStorage.getItem('authToken');
    setAuthToken(token);
    loadAIMetadata();
  };

  const loadAIMetadata = async () => {
    try {
      const response = await photoAPI.getAIMetadata(photo.id);
      setAIMetadata(response);
    } catch (error) {
      console.error('AI metadata error:', error);
    }
  };

  const handleEnhance = () => {
    navigation.navigate('EnhancePhoto', { photo });
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot save photo without permission');
        return;
      }

      const imageUrl = showOriginal ? photo.url : (photo.edited_url || photo.url);
      const fileUri = FileSystem.documentDirectory + `photo_${photo.id}.jpg`;
      
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
      const asset = await MediaLibrary.createAssetAsync(uri);
      
      Alert.alert('Success', 'Photo saved to your library!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await photoAPI.deletePhoto(photo.id);
              Alert.alert('Success', 'Photo deleted', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  // Use same URL pattern as Dashboard and Gallery
  const getImageUrl = (urlPath) => {
    if (!urlPath) return null;
    if (urlPath.startsWith('http')) return urlPath;
    if (urlPath.startsWith('/')) return `${BASE_URL}${urlPath}`;
    return urlPath;
  };

  const originalImageUrl = getImageUrl(photo.original_url || photo.url);
  const editedImageUrl = getImageUrl(photo.edited_url);
  const imageUrl = showOriginal ? originalImageUrl : (editedImageUrl || originalImageUrl);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Detail</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#E85D75" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {imageUrl && authToken ? (
          <Image 
            source={{ 
              uri: imageUrl,
              headers: {
                Authorization: `Bearer ${authToken}`
              }
            }} 
            style={styles.image} 
          />
        ) : (
          <View style={styles.image}>
            <ActivityIndicator size="large" color="#E85D75" />
          </View>
        )}

        {photo.edited_url && (
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                showOriginal && styles.toggleButtonActive,
              ]}
              onPress={() => setShowOriginal(true)}
            >
              <Text
                style={[
                  styles.toggleText,
                  showOriginal && styles.toggleTextActive,
                ]}
              >
                Original
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !showOriginal && styles.toggleButtonActive,
              ]}
              onPress={() => setShowOriginal(false)}
            >
              <Text
                style={[
                  styles.toggleText,
                  !showOriginal && styles.toggleTextActive,
                ]}
              >
                Enhanced
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEnhance}>
            <Ionicons name="sparkles" size={24} color="#E85D75" />
            <Text style={styles.actionText}>Enhance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDownload}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#E85D75" />
            ) : (
              <>
                <Ionicons name="download" size={24} color="#E85D75" />
                <Text style={styles.actionText}>Download</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social" size={24} color="#E85D75" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {aiMetadata && (
          <View style={styles.metadataContainer}>
            <Text style={styles.metadataTitle}>AI Analysis</Text>
            
            {aiMetadata.objects && aiMetadata.objects.length > 0 && (
              <View style={styles.metadataSection}>
                <Text style={styles.metadataLabel}>Objects Detected:</Text>
                <View style={styles.tagContainer}>
                  {aiMetadata.objects.map((obj, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{obj}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {aiMetadata.description && (
              <View style={styles.metadataSection}>
                <Text style={styles.metadataLabel}>Description:</Text>
                <Text style={styles.metadataValue}>{aiMetadata.description}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Photo Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Filename:</Text>
            <Text style={styles.infoValue}>{photo.filename}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>
              {new Date(photo.created_at).toLocaleDateString()}
            </Text>
          </View>
          {photo.file_size && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Size:</Text>
              <Text style={styles.infoValue}>
                {(photo.file_size / 1024 / 1024).toFixed(2)} MB
              </Text>
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
  image: {
    width: width,
    height: width,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  toggleButtonActive: {
    backgroundColor: '#E85D75',
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#E85D75',
    marginTop: 5,
  },
  metadataContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metadataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metadataSection: {
    marginBottom: 15,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  metadataValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  tagText: {
    fontSize: 12,
    color: '#E85D75',
  },
  infoContainer: {
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
});
