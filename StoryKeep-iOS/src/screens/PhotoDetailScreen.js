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
import { Audio } from 'expo-av';
import { photoAPI, voiceMemoAPI } from '../services/api';
import * as FileSystem from 'expo-file-system/legacy';
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
  
  // Simple voice memo debug states
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    loadData();
    
    // Cleanup on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
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

  // Simple debugging voice memo functions
  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordedUri(null);
      setFileSize(null);
      console.log('✅ Recording started');
    } catch (error) {
      console.error('❌ Recording start error:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log('⏹️ Stopping recording...');
      setIsRecording(false);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecordedUri(uri);

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
      setFileSize(`${sizeMB} MB`);
      
      console.log('✅ Recording stopped');
      console.log('📁 File URI:', uri);
      console.log('📊 File size:', sizeMB, 'MB');
      
      Alert.alert('Recording Complete', `File size: ${sizeMB} MB`);
    } catch (error) {
      console.error('❌ Recording stop error:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const playRecording = async () => {
    if (!recordedUri) return;

    try {
      console.log('▶️ Playing recording...');
      
      // Stop any existing playback
      if (sound) {
        await sound.unloadAsync();
      }

      // Set audio mode for playback (works even in silent mode)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log('✅ Playback finished');
        }
      });
      
      console.log('✅ Playing with audio mode configured...');
    } catch (error) {
      console.error('❌ Playback error:', error);
      Alert.alert('Error', 'Failed to play recording: ' + error.message);
    }
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
            resizeMode="contain"
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

        <View style={styles.voiceContainer}>
          <Text style={styles.voiceTitle}>Voice Note Debug</Text>
          
          <View style={styles.debugControls}>
            {!isRecording && !recordedUri && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={startRecording}
              >
                <Ionicons name="mic" size={32} color="#fff" />
                <Text style={styles.buttonText}>Start Recording</Text>
              </TouchableOpacity>
            )}

            {isRecording && (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopRecording}
              >
                <Ionicons name="stop-circle" size={32} color="#fff" />
                <Text style={styles.buttonText}>Stop Recording</Text>
              </TouchableOpacity>
            )}

            {recordedUri && (
              <View style={styles.recordingInfo}>
                <View style={styles.fileSizeContainer}>
                  <Text style={styles.fileSizeLabel}>File Size:</Text>
                  <Text style={styles.fileSizeValue}>{fileSize}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.replayButton}
                  onPress={playRecording}
                >
                  <Ionicons name="play-circle" size={32} color="#fff" />
                  <Text style={styles.buttonText}>Replay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    setRecordedUri(null);
                    setFileSize(null);
                  }}
                >
                  <Text style={styles.resetButtonText}>New Recording</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  voiceContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  voiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  debugControls: {
    alignItems: 'center',
    gap: 15,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E85D75',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingInfo: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  fileSizeContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  fileSizeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  fileSizeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E85D75',
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
