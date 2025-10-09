import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 30) / 3;

export default function GalleryScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async (pageNumber = 1, refresh = false) => {
    try {
      console.log(`📸 Loading photos - Page: ${pageNumber}, Refresh: ${refresh}`);
      
      if (refresh) {
        setIsRefreshing(true);
      } else if (pageNumber === 1) {
        setIsLoading(true);
      }

      setError(null);
      const response = await apiService.getPhotos(pageNumber, 20);
      
      console.log('📸 API Response:', JSON.stringify(response, null, 2));
      console.log('📸 Response type:', typeof response);
      console.log('📸 Response keys:', Object.keys(response || {}));
      
      if (!response) {
        console.error('❌ No response from API');
        setError('No response from server');
        return;
      }

      // Handle both direct response and nested data response
      const data = response.data || response;
      
      if (data.error || response.error) {
        console.error('❌ API Error:', data.error || response.error);
        setError(data.error || response.error);
        return;
      }

      // Check for success flag
      if (data.success === false) {
        console.error('❌ API returned success: false');
        setError(data.message || 'Failed to load photos');
        return;
      }

      const photosList = data.photos || response.photos || [];
      console.log(`📸 Photos array length: ${photosList.length}`);
      console.log(`📸 First photo:`, JSON.stringify(photosList[0], null, 2));
      
      if (refresh || pageNumber === 1) {
        setPhotos(photosList);
        console.log(`📸 Set ${photosList.length} photos (replace)`);
      } else {
        setPhotos(prev => {
          const combined = [...prev, ...photosList];
          console.log(`📸 Added ${photosList.length} photos to ${prev.length} existing = ${combined.length} total`);
          return combined;
        });
      }

      const hasMorePages = data.has_more || response.has_more || false;
      const totalCount = data.total || response.total || 0;
      
      setHasMore(hasMorePages);
      setPage(pageNumber);
      console.log(`📸 Has more: ${hasMorePages}, Total: ${totalCount}`);

    } catch (error) {
      console.error('❌ Error loading photos:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      setError(error.message || 'Failed to load photos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadPhotos(1, true);
  }, []);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      loadPhotos(page + 1);
    }
  };

  const openPhoto = (photo) => {
    console.log('📸 Opening photo:', photo.id);
    navigation.navigate('PhotoView', { photo });
  };

  const openCamera = () => {
    navigation.navigate('Camera');
  };

  const renderPhoto = ({ item, index }) => {
    console.log(`📸 Rendering photo ${index}:`, item.id, item.url?.substring(0, 50));
    
    return (
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={() => openPhoto(item)}
      >
        <Image
          source={{ uri: item.thumbnail_url || item.url }}
          style={styles.photo}
          resizeMode="cover"
          onError={(e) => console.error(`❌ Image load error for ${item.id}:`, e.nativeEvent.error)}
          onLoad={() => console.log(`✅ Image loaded: ${item.id}`)}
        />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {error ? '⚠️ Error' : 'No Photos Yet'}
      </Text>
      <Text style={styles.emptyDescription}>
        {error || 'Start building your photo collection by taking some pictures!'}
      </Text>
      {!error && (
        <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
          <Text style={styles.cameraButtonText}>Open Camera</Text>
        </TouchableOpacity>
      )}
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={() => loadPhotos(1, true)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  if (isLoading && photos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  console.log(`📸 Rendering FlatList with ${photos.length} photos`);

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        numColumns={3}
        contentContainerStyle={photos.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  list: {
    padding: 5,
  },
  emptyList: {
    flexGrow: 1,
  },
  photoContainer: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    paddingHorizontal: 30,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    paddingHorizontal: 30,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
});
