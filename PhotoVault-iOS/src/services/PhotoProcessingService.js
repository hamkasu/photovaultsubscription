import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

class PhotoProcessingService {
  async processPhoto(uri, options = {}) {
    try {
      const {
        autoCrop = true,
        perspectiveCorrection = true,
        enhance = true,
      } = options;

      let processedUri = uri;

      if (enhance) {
        processedUri = await this.autoEnhance(processedUri);
      }

      return processedUri;
    } catch (error) {
      console.error('Error processing photo:', error);
      throw error;
    }
  }

  async autoEnhance(uri) {
    try {
      const manipulateResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 2048 } },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulateResult.uri;
    } catch (error) {
      console.error('Error enhancing photo:', error);
      return uri;
    }
  }

  async cropToRectangle(uri, cropRect) {
    try {
      const { x, y, width, height } = cropRect;

      const manipulateResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: x,
              originY: y,
              width,
              height,
            },
          },
        ],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulateResult.uri;
    } catch (error) {
      console.error('Error cropping photo:', error);
      throw error;
    }
  }

  async perspectiveCorrection(uri, corners) {
    try {
      return uri;
    } catch (error) {
      console.error('Error applying perspective correction:', error);
      return uri;
    }
  }

  async saveToCache(uri, filename) {
    try {
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri,
      });
      return fileUri;
    } catch (error) {
      console.error('Error saving to cache:', error);
      throw error;
    }
  }

  async deleteFromCache(uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Error deleting from cache:', error);
    }
  }

  async getImageInfo(uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo;
    } catch (error) {
      console.error('Error getting image info:', error);
      return null;
    }
  }
}

export default new PhotoProcessingService();
