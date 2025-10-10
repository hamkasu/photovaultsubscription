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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { photoAPI } from '../services/api';

const BASE_URL = 'https://web-production-535bd.up.railway.app';

export default function GalleryScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    loadPhotos();
  }, [filter]);

  const loadPhotos = async () => {
    try {
      const [response, token] = await Promise.all([
        photoAPI.getPhotos(filter),
        AsyncStorage.getItem('authToken'),
      ]);
      setPhotos(response.photos || []);
      setAuthToken(token);
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPhotos();
  };

  const renderPhoto = ({ item }) => {
    // Get the image URL - prefer thumbnail, fallback to url or original_url
    const imageUrl = item.thumbnail_url || item.url || item.original_url;
    
    // Construct full URL if it's a relative path
    const fullImageUrl = imageUrl?.startsWith('http') 
      ? imageUrl 
      : imageUrl?.startsWith('/') 
        ? `${BASE_URL}${imageUrl}`
        : imageUrl;

    return (
      <TouchableOpacity
        style={styles.photoCard}
        onPress={() => navigation.navigate('PhotoDetail', { photo: item })}
      >
        {fullImageUrl && authToken ? (
          <Image
            source={{ 
              uri: fullImageUrl,
              headers: {
                Authorization: `Bearer ${authToken}`
              }
            }}
            style={styles.photoImage}
          />
        ) : (
          <View style={styles.photoImagePlaceholder}>
            <ActivityIndicator size="small" color="#E85D75" />
          </View>
        )}
        {item.edited_url && (
          <View style={styles.enhancedBadge}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
        )}
        {item.voice_memo_count > 0 && (
          <View style={styles.voiceBadge}>
            <Ionicons name="mic" size={14} color="#fff" />
            <Text style={styles.voiceBadgeText}>{item.voice_memo_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ label, value }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterText,
          filter === value && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
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
        <Text style={styles.title}>Gallery</Text>
        <Text style={styles.count}>{photos.length} photos</Text>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton label="All" value="all" />
        <FilterButton label="Originals" value="originals" />
        <FilterButton label="Enhanced" value="enhanced" />
      </View>

      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No photos yet</Text>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <Text style={styles.captureButtonText}>Capture Photos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.photoList}
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  count: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#E85D75',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
  photoImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  enhancedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E85D75',
    borderRadius: 12,
    padding: 4,
  },
  voiceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceBadgeText: {
    color: '#fff',
    fontSize: 12,
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
    marginBottom: 30,
  },
  captureButton: {
    backgroundColor: '#E85D75',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
