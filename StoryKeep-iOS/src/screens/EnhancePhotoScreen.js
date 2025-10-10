import React, { useState } from 'react';
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
import { photoAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function EnhancePhotoScreen({ route, navigation }) {
  const { photo } = route.params;
  const [processing, setProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);

  const handleAutoEnhance = async () => {
    setProcessing(true);
    try {
      const response = await photoAPI.enhancePhoto(photo.id, {
        auto_enhance: true,
      });

      Alert.alert('Success', 'Photo enhanced successfully!', [
        {
          text: 'View',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to enhance photo');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleColorize = async () => {
    setProcessing(true);
    try {
      const response = await photoAPI.colorizePhoto(photo.id);

      Alert.alert('Success', 'Photo colorized successfully!', [
        {
          text: 'View',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to colorize photo');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const EnhancementOption = ({ icon, title, description, onPress, color }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={onPress}
      disabled={processing}
    >
      <View style={[styles.optionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.optionInfo}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  const imageUrl = showOriginal ? photo.url : (photo.edited_url || photo.url);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enhance Photo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView>
        <Image source={{ uri: imageUrl }} style={styles.image} />

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

        <View style={styles.options}>
          <Text style={styles.sectionTitle}>Enhancement Options</Text>

          <EnhancementOption
            icon="sparkles"
            title="Auto Enhance"
            description="AI-powered automatic enhancement"
            onPress={handleAutoEnhance}
            color="#E85D75"
          />

          <EnhancementOption
            icon="color-palette"
            title="Colorize"
            description="Add color to black & white photos"
            onPress={handleColorize}
            color="#4CAF50"
          />

          <EnhancementOption
            icon="contrast"
            title="Adjust Brightness"
            description="Fine-tune brightness and contrast"
            color="#2196F3"
          />

          <EnhancementOption
            icon="brush"
            title="Sharpen"
            description="Increase image sharpness"
            color="#FF9800"
          />

          <EnhancementOption
            icon="water"
            title="Denoise"
            description="Remove grain and noise"
            color="#9C27B0"
          />
        </View>

        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#E85D75" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
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
  placeholder: {
    width: 28,
  },
  image: {
    width: width,
    height: width,
    backgroundColor: '#f0f0f0',
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
  options: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
});
