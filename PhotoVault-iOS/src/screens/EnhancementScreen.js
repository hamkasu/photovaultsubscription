import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

export default function EnhancementScreen({ route, navigation }) {
  const { photo } = route.params;
  const [enhancedUrl, setEnhancedUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentView, setCurrentView] = useState('original'); // 'original', 'enhanced', 'sideBySide'

  const handleEnhance = async () => {
    setIsProcessing(true);
    try {
      const settings = {
        clahe_enabled: true,
        denoise: true,
        auto_levels: true,
        brightness: 1.15,
        contrast: 1.3,
        color: 1.2,
        sharpness: 1.4,
      };

      const response = await apiService.enhancePhoto(photo.id, settings);
      
      if (response.success) {
        setEnhancedUrl(response.enhanced_url + '?t=' + Date.now());
        setCurrentView('enhanced');
        Alert.alert('Success', 'Photo enhanced successfully!');
      } else {
        Alert.alert('Error', response.error || 'Enhancement failed');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      Alert.alert('Error', 'Failed to enhance photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharpen = async () => {
    setIsProcessing(true);
    try {
      const response = await apiService.sharpenPhoto(photo.id, {
        radius: 2.0,
        amount: 1.5,
        threshold: 3,
        method: 'unsharp',
      });
      
      if (response.success) {
        setEnhancedUrl(response.enhanced_url + '?t=' + Date.now());
        setCurrentView('enhanced');
        Alert.alert('Success', 'Photo sharpened successfully!');
      } else {
        Alert.alert('Error', response.error || 'Sharpening failed');
      }
    } catch (error) {
      console.error('Sharpen error:', error);
      Alert.alert('Error', 'Failed to sharpen photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleColorize = async () => {
    setIsProcessing(true);
    try {
      const response = await apiService.colorizePhoto(photo.id, 'dnn');
      
      if (response.success) {
        setEnhancedUrl(response.edited_url + '?t=' + Date.now());
        setCurrentView('enhanced');
        Alert.alert('Success', 'Photo colorized successfully!');
      } else {
        Alert.alert('Error', response.error || 'Colorization failed');
      }
    } catch (error) {
      console.error('Colorize error:', error);
      Alert.alert('Error', 'Failed to colorize photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderOriginalView = () => (
    <View style={styles.imageContainer}>
      <Text style={styles.viewLabel}>Original</Text>
      <Image
        source={{ uri: photo.url }}
        style={styles.fullImage}
        resizeMode="contain"
      />
    </View>
  );

  const renderEnhancedView = () => (
    <View style={styles.imageContainer}>
      <Text style={styles.viewLabel}>Enhanced</Text>
      <Image
        source={{ uri: enhancedUrl || photo.url }}
        style={styles.fullImage}
        resizeMode="contain"
      />
    </View>
  );

  const renderSideBySideView = () => (
    <ScrollView horizontal style={styles.sideBySideContainer}>
      <View style={styles.halfImageContainer}>
        <Text style={styles.viewLabel}>Original</Text>
        <Image
          source={{ uri: photo.url }}
          style={styles.halfImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.halfImageContainer}>
        <Text style={styles.viewLabel}>Enhanced</Text>
        <Image
          source={{ uri: enhancedUrl || photo.url }}
          style={styles.halfImage}
          resizeMode="contain"
        />
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Enhancement</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, currentView === 'original' && styles.toggleButtonActive]}
          onPress={() => setCurrentView('original')}
        >
          <Text style={[styles.toggleText, currentView === 'original' && styles.toggleTextActive]}>
            Original
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, currentView === 'enhanced' && styles.toggleButtonActive]}
          onPress={() => setCurrentView('enhanced')}
          disabled={!enhancedUrl}
        >
          <Text style={[styles.toggleText, currentView === 'enhanced' && styles.toggleTextActive]}>
            Enhanced
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, currentView === 'sideBySide' && styles.toggleButtonActive]}
          onPress={() => setCurrentView('sideBySide')}
          disabled={!enhancedUrl}
        >
          <Text style={[styles.toggleText, currentView === 'sideBySide' && styles.toggleTextActive]}>
            Compare
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Display */}
      <View style={styles.imageSection}>
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
        
        {currentView === 'original' && renderOriginalView()}
        {currentView === 'enhanced' && renderEnhancedView()}
        {currentView === 'sideBySide' && renderSideBySideView()}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, isProcessing && styles.actionButtonDisabled]}
          onPress={handleEnhance}
          disabled={isProcessing}
        >
          <Ionicons name="sparkles" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Enhance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isProcessing && styles.actionButtonDisabled]}
          onPress={handleSharpen}
          disabled={isProcessing}
        >
          <Ionicons name="contrast" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Sharpen</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isProcessing && styles.actionButtonDisabled]}
          onPress={handleColorize}
          disabled={isProcessing}
        >
          <Ionicons name="color-palette" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Colorize</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewToggle: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  imageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width - 20,
    height: '90%',
  },
  viewLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sideBySideContainer: {
    flex: 1,
  },
  halfImageContainer: {
    width: width * 0.9,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  halfImage: {
    width: '100%',
    height: '90%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    minWidth: 100,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
});
