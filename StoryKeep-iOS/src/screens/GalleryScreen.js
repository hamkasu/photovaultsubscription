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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { photoAPI } from '../services/api';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = (width - 6) / COLUMN_COUNT; // 2px gap between items
const BASE_URL = 'https://web-production-535bd.up.railway.app';

export default function GalleryScreen({ navigation }) {
  const [allPhotos, setAllPhotos] = useState([]);
  const [displayPhotos, setDisplayPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, allPhotos]);

  const loadPhotos = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setAuthToken(token);
      
      // Get ALL photos from dashboard endpoint
      const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const dashboardData = await dashboardResponse.json();
      
      if (dashboardData.all_photos && dashboardData.all_photos.length > 0) {
        setAllPhotos(dashboardData.all_photos);
      } else {
        setAllPhotos([]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...allPhotos];
    
    if (filter === 'colorized') {
      filtered = allPhotos.filter(photo => photo.edited_url);
    } else if (filter === 'originals') {
      filtered = allPhotos.filter(photo => !photo.edited_url);
    } else if (filter === 'dnn') {
      // Photos colorized with DNN method
      filtered = allPhotos.filter(photo => 
        photo.enhancement_metadata && 
        photo.enhancement_metadata.colorization &&
        photo.enhancement_metadata.colorization.method === 'dnn'
      );
    } else if (filter === 'ai') {
      // Photos colorized with AI method
      filtered = allPhotos.filter(photo => 
        photo.enhancement_metadata && 
        photo.enhancement_metadata.colorization &&
        photo.enhancement_metadata.colorization.method === 'ai_guided_dnn'
      );
    } else if (filter === 'uncolorized') {
      // Photos without colorization
      filtered = allPhotos.filter(photo => !photo.enhancement_metadata);
    }
    
    setDisplayPhotos(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPhotos();
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

  const renderPhoto = ({ item, index }) => {
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
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoImagePlaceholder}>
            <ActivityIndicator size="small" color="#E85D75" />
          </View>
        )}
        
        {/* Bottom gradient overlay */}
        <View style={styles.bottomOverlay}>
          <Text style={styles.photoDate} numberOfLines={1}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        {/* Top right badges - Colorized */}
        {item.edited_url && (
          <View style={styles.enhancedBadge}>
            <Ionicons name="sparkles" size={14} color="#fff" />
          </View>
        )}
        
        {/* Top left badges */}
        {item.voice_memo_count > 0 && (
          <View style={styles.voiceBadge}>
            <Ionicons name="mic" size={12} color="#fff" />
            <Text style={styles.voiceBadgeText}>{item.voice_memo_count}</Text>
          </View>
        )}
        
        {item.comment_count > 0 && (
          <View style={[styles.voiceBadge, { top: item.voice_memo_count > 0 ? 34 : 6 }]}>
            <Ionicons name="chatbox" size={12} color="#fff" />
            <Text style={styles.voiceBadgeText}>{item.comment_count}</Text>
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
        <Text style={styles.count}>{displayPhotos.length} photos</Text>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton label="All" value="all" />
        <FilterButton label="DNN" value="dnn" />
        <FilterButton label="AI" value="ai" />
        <FilterButton label="Uncolorized" value="uncolorized" />
        <FilterButton label="Originals" value="originals" />
        <FilterButton label="Colorized" value="colorized" />
      </View>

      {displayPhotos.length === 0 ? (
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
          data={displayPhotos}
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  count: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
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
  photoImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
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
  voiceBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceBadgeText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 3,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
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
