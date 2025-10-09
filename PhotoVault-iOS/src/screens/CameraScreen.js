import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';
import UploadQueueService from '../services/UploadQueueService';
import PhotoProcessingService from '../services/PhotoProcessingService';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [showGuides, setShowGuides] = useState(true);
  const cameraRef = useRef(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color="#ccc" />
          <Text style={styles.permissionText}>
            Camera permission is required to digitalize photos
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const toggleBatchMode = () => {
    if (batchMode) {
      Alert.alert(
        'End Batch Session',
        `You captured ${capturedCount} photos. They will be uploaded automatically.`,
        [
          {
            text: 'Continue',
            style: 'cancel',
          },
          {
            text: 'End Session',
            onPress: () => {
              setBatchMode(false);
              setCapturedCount(0);
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      setBatchMode(true);
      setCapturedCount(0);
      Alert.alert(
        'Batch Mode',
        'Batch mode enabled. Capture multiple photos in succession. They will be queued for upload.',
        [{ text: 'Got it' }]
      );
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || capturing) return;

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      await processAndUpload(photo.uri);

      if (batchMode) {
        setCapturedCount(prev => prev + 1);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Capture Failed', error.message);
    } finally {
      setCapturing(false);
    }
  };

  const processAndUpload = async (uri) => {
    setProcessing(true);
    try {
      const processedUri = await PhotoProcessingService.processPhoto(uri, {
        enhance: true,
      });

      const saved = await PhotoProcessingService.saveToCache(
        processedUri,
        `digitized_${Date.now()}.jpg`
      );

      await UploadQueueService.addToQueue(saved, {
        source: 'camera',
        captureDate: new Date().toISOString(),
        batchMode,
      });

      if (!batchMode) {
        Alert.alert('Success', 'Photo captured and queued for upload');
      }
    } catch (error) {
      console.error('Error processing photo:', error);
      Alert.alert('Processing Failed', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const detectAndExtract = async () => {
    if (!cameraRef.current || capturing) return;

    setCapturing(true);
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });

      const result = await ApiService.detectAndExtractPhotos(photo.uri);

      if (result.extracted_photos && result.extracted_photos.length > 0) {
        Alert.alert(
          'Photos Detected',
          `Found ${result.extracted_photos.length} photo(s) and uploaded successfully!`,
          [{ text: 'Great!', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'No Photos Detected',
          'Could not detect any photos in the image. Try adjusting the angle or lighting.',
          [{ text: 'Try Again' }]
        );
      }
    } catch (error) {
      console.error('Error detecting photos:', error);
      Alert.alert('Detection Failed', error.message);
    } finally {
      setCapturing(false);
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        {showGuides && (
          <View style={styles.guidesContainer}>
            <View style={styles.guideBox} />
            <Text style={styles.guideText}>
              Position photo within the frame
            </Text>
          </View>
        )}

        {batchMode && (
          <View style={styles.batchBadge}>
            <Text style={styles.batchText}>BATCH MODE: {capturedCount} photos</Text>
          </View>
        )}

        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={() => setShowGuides(!showGuides)}>
            <Ionicons name={showGuides ? 'grid' : 'grid-outline'} size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Ionicons
              name={flash === 'off' ? 'flash-off' : flash === 'on' ? 'flash' : 'flash-outline'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={toggleBatchMode}
            disabled={processing || capturing}
          >
            <Ionicons
              name={batchMode ? 'albums' : 'albums-outline'}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, (capturing || processing) && styles.captureButtonDisabled]}
            onPress={capturePhoto}
            disabled={capturing || processing}
          >
            {capturing || processing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={detectAndExtract}
            disabled={processing || capturing}
          >
            <Ionicons name="scan" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>Processing photo...</Text>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  guidesContainer: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  guideBox: {
    width: width - 80,
    height: (width - 80) * 1.4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  guideText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  batchBadge: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  batchText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  topControls: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
  },
});
