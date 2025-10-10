import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { photoAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

// Flash mode constants for expo-camera v17+
const FLASH_MODE = {
  off: 'off',
  on: 'on',
  auto: 'auto',
};

// Camera type constants for expo-camera v17+
const CAMERA_TYPE = {
  back: 'back',
  front: 'front',
};

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState(FLASH_MODE.off);
  const [batchMode, setBatchMode] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const cameraRef = useRef(null);

  const toggleFlash = () => {
    setFlashMode((current) =>
      current === FLASH_MODE.off
        ? FLASH_MODE.on
        : current === FLASH_MODE.on
        ? FLASH_MODE.auto
        : FLASH_MODE.off
    );
  };

  const getFlashIcon = () => {
    if (flashMode === FLASH_MODE.off) return 'flash-off';
    if (flashMode === FLASH_MODE.on) return 'flash';
    return 'flash-outline';
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        setProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: true,
        });

        // Auto-enhance the captured photo
        const enhancedPhoto = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            { resize: { width: 1920 } },
          ],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        if (batchMode) {
          setCapturedPhotos([...capturedPhotos, enhancedPhoto]);
          Alert.alert('Photo Captured', `${capturedPhotos.length + 1} photos in batch`);
        } else {
          await processAndUpload(enhancedPhoto.uri);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
        console.error(error);
      } finally {
        setProcessing(false);
      }
    }
  };

  const processAndUpload = async (photoUri) => {
    try {
      setProcessing(true);

      const formData = new FormData();
      formData.append('image', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      });

      const response = await photoAPI.detectAndExtract(formData);

      if (response.success) {
        Alert.alert(
          'Success',
          `Photo uploaded! ${response.photos_extracted || 0} photo(s) extracted`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Gallery'),
            },
          ]
        );
      } else {
        Alert.alert('Upload Complete', 'Photo uploaded but no extraction needed');
      }
    } catch (error) {
      Alert.alert('Upload Failed', error.response?.data?.message || 'Please try again');
    } finally {
      setProcessing(false);
    }
  };

  const finishBatch = async () => {
    if (capturedPhotos.length === 0) {
      Alert.alert('No Photos', 'Please capture some photos first');
      return;
    }

    setProcessing(true);
    
    try {
      for (const photo of capturedPhotos) {
        await processAndUpload(photo.uri);
      }

      Alert.alert(
        'Batch Complete',
        `Successfully uploaded ${capturedPhotos.length} photos`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCapturedPhotos([]);
              setBatchMode(false);
              navigation.navigate('Gallery');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Batch Upload Failed', 'Some photos may not have uploaded');
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={CAMERA_TYPE.back}
        flash={flashMode}
      >
        {showGuides && (
          <View style={styles.guides}>
            <View style={styles.guideFrame} />
            <Text style={styles.guideText}>
              Align photos within the frame - Multiple photos supported
            </Text>
          </View>
        )}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowGuides(!showGuides)}
            >
              <Ionicons
                name={showGuides ? 'grid' : 'grid-outline'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
              <Ionicons name={getFlashIcon()} size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.batchButton,
              batchMode && styles.batchButtonActive,
            ]}
            onPress={() => setBatchMode(!batchMode)}
          >
            <Ionicons
              name="albums"
              size={24}
              color={batchMode ? '#E85D75' : '#fff'}
            />
            <Text
              style={[
                styles.batchText,
                batchMode && styles.batchTextActive,
              ]}
            >
              {batchMode ? `Batch (${capturedPhotos.length})` : 'Single'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              processing && styles.captureButtonDisabled,
            ]}
            onPress={capturePhoto}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          {batchMode && capturedPhotos.length > 0 ? (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={finishBatch}
            >
              <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#E85D75',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guides: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: width * 0.95,
    height: height * 0.7,
    borderWidth: 3,
    borderColor: '#E85D75',
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  guideText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 10,
    marginLeft: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  batchButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  batchButtonActive: {
    backgroundColor: '#fff',
  },
  batchText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  batchTextActive: {
    color: '#E85D75',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  finishButton: {
    padding: 10,
  },
  placeholder: {
    width: 52,
  },
});
