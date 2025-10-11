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
  
  // Voice memo states
  const [voiceMemos, setVoiceMemos] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingSound, setPlayingSound] = useState(null);
  const [playingMemoId, setPlayingMemoId] = useState(null);

  useEffect(() => {
    loadData();
    loadVoiceMemos();
    
    // Cleanup on unmount
    return () => {
      if (playingSound) {
        playingSound.stopAsync();
        playingSound.unloadAsync();
      }
      // Clean up any temp voice memo files
      FileSystem.readDirectoryAsync(FileSystem.cacheDirectory)
        .then(files => {
          const voiceFiles = files.filter(f => f.startsWith('voice_memo_'));
          return Promise.all(
            voiceFiles.map(f => 
              FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${f}`, { idempotent: true })
                .catch(() => {})
            )
          );
        })
        .catch(() => {});
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

  // Voice memo functions
  const loadVoiceMemos = async () => {
    try {
      const response = await voiceMemoAPI.getVoiceMemos(photo.id);
      if (response.success) {
        setVoiceMemos(response.voice_memos || []);
      }
    } catch (error) {
      console.error('Error loading voice memos:', error);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed to record voice notes');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.LOW,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 32000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 32000,
        },
      });
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
      console.error(error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      
      // Get recording status to extract duration
      const status = await recording.getStatusAsync();
      const durationSeconds = status.durationMillis ? status.durationMillis / 1000 : 0;
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Check file size before upload (Railway has 10MB limit)
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSizeMB = fileInfo.size / (1024 * 1024);
      
      if (fileSizeMB > 8) {
        Alert.alert(
          'Recording Too Long',
          `Voice note is ${fileSizeMB.toFixed(1)}MB. Please keep recordings under 8MB (about 30 minutes at current quality).`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Upload the recording with duration
      setLoading(true);
      const response = await voiceMemoAPI.uploadVoiceMemo(photo.id, uri, durationSeconds);
      
      if (response.success) {
        Alert.alert('Success', 'Voice note recorded successfully');
        loadVoiceMemos();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save voice note');
      console.error('Voice memo upload error:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const playVoiceMemo = async (memo) => {
    try {
      // Stop current playback if any
      if (playingSound) {
        await playingSound.stopAsync();
        await playingSound.unloadAsync();
        setPlayingSound(null);
        setPlayingMemoId(null);
      }

      // If clicking the same memo, just stop
      if (playingMemoId === memo.id) {
        return;
      }

      // Download audio file with proper authentication to local temp file
      const audioUrl = `${BASE_URL}/api/voice-memos/${memo.id}/audio`;
      const token = await AsyncStorage.getItem('authToken');
      const localUri = `${FileSystem.cacheDirectory}voice_memo_${memo.id}.m4a`;

      // Download with authenticated headers
      await FileSystem.downloadAsync(
        audioUrl,
        localUri,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Play from local file (no authentication needed)
      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { shouldPlay: true }
      );
      
      setPlayingSound(sound);
      setPlayingMemoId(memo.id);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingMemoId(null);
          sound.unloadAsync();
          setPlayingSound(null);
          // Clean up temp file
          FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {});
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to play voice note');
      console.error(error);
    }
  };

  const deleteVoiceMemoHandler = async (memoId) => {
    Alert.alert(
      'Delete Voice Note',
      'Are you sure you want to delete this voice note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await voiceMemoAPI.deleteVoiceMemo(memoId);
              Alert.alert('Success', 'Voice note deleted');
              loadVoiceMemos();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete voice note');
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
          <View style={styles.voiceHeader}>
            <Text style={styles.voiceTitle}>Voice Notes</Text>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={loading}
            >
              <Ionicons 
                name={isRecording ? 'stop-circle' : 'mic'} 
                size={24} 
                color="#fff" 
              />
              <Text style={styles.recordButtonText}>
                {isRecording ? 'Stop' : 'Record'}
              </Text>
            </TouchableOpacity>
          </View>

          {voiceMemos.length === 0 ? (
            <View style={styles.emptyVoiceContainer}>
              <Ionicons name="mic-outline" size={48} color="#ccc" />
              <Text style={styles.emptyVoiceText}>No voice notes yet</Text>
              <Text style={styles.emptyVoiceSubtext}>Tap Record to add a voice note</Text>
            </View>
          ) : (
            <View style={styles.voiceMemosList}>
              {voiceMemos.map((memo) => (
                <View key={memo.id} style={styles.voiceMemoCard}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => playVoiceMemo(memo)}
                  >
                    <Ionicons
                      name={playingMemoId === memo.id ? 'pause-circle' : 'play-circle'}
                      size={40}
                      color="#E85D75"
                    />
                  </TouchableOpacity>
                  <View style={styles.voiceMemoInfo}>
                    <Text style={styles.voiceMemoDate}>
                      {new Date(memo.created_at).toLocaleDateString()}
                    </Text>
                    <Text style={styles.voiceMemoTime}>
                      {new Date(memo.created_at).toLocaleTimeString()}
                    </Text>
                    <Text style={styles.voiceMemoDuration}>
                      {memo.duration_formatted || '00:00'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteVoiceButton}
                    onPress={() => deleteVoiceMemoHandler(memo.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              ))}
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
  voiceContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  voiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E85D75',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  recordingButton: {
    backgroundColor: '#FF4444',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyVoiceContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyVoiceText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  emptyVoiceSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  voiceMemosList: {
    gap: 12,
  },
  voiceMemoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceMemoInfo: {
    flex: 1,
  },
  voiceMemoDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  voiceMemoTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  voiceMemoDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E85D75',
    marginTop: 4,
  },
  deleteVoiceButton: {
    padding: 8,
  },
});
