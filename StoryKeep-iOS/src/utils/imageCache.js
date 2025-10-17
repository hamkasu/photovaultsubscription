import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = FileSystem.cacheDirectory + 'images/';
const CACHE_INDEX_KEY = 'image_cache_index';
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB max cache size

// Ensure cache directory exists
async function ensureCacheDir() {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

// Get cache index (mapping of URLs to cached file paths)
async function getCacheIndex() {
  try {
    const indexStr = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    return indexStr ? JSON.parse(indexStr) : {};
  } catch (error) {
    console.error('Error reading cache index:', error);
    return {};
  }
}

// Save cache index
async function saveCacheIndex(index) {
  try {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error('Error saving cache index:', error);
  }
}

// Generate cache filename from URL
function getCacheFilename(url) {
  return url.replace(/[^a-zA-Z0-9]/g, '_') + '.jpg';
}

// Calculate total cache size
async function getCacheSize() {
  try {
    const index = await getCacheIndex();
    let totalSize = 0;
    
    for (const filePath of Object.values(index)) {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        totalSize += fileInfo.size;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return 0;
  }
}

// Remove oldest cached images to make space
async function cleanupCache() {
  try {
    const index = await getCacheIndex();
    const cacheSize = await getCacheSize();
    
    if (cacheSize > MAX_CACHE_SIZE) {
      console.log(`🧹 Cache cleanup: ${cacheSize} bytes > ${MAX_CACHE_SIZE} bytes`);
      
      // Get file stats with timestamps
      const fileStats = [];
      for (const [url, filePath] of Object.entries(index)) {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          fileStats.push({
            url,
            filePath,
            modificationTime: fileInfo.modificationTime,
            size: fileInfo.size,
          });
        }
      }
      
      // Sort by modification time (oldest first)
      fileStats.sort((a, b) => a.modificationTime - b.modificationTime);
      
      // Delete oldest files until we're under the limit
      let currentSize = cacheSize;
      for (const file of fileStats) {
        if (currentSize <= MAX_CACHE_SIZE * 0.8) { // Clean to 80% of max
          break;
        }
        
        await FileSystem.deleteAsync(file.filePath, { idempotent: true });
        delete index[file.url];
        currentSize -= file.size;
        console.log(`🗑️ Deleted cached image: ${file.filePath}`);
      }
      
      await saveCacheIndex(index);
    }
  } catch (error) {
    console.error('Error during cache cleanup:', error);
  }
}

/**
 * Download image with real progress tracking and caching
 * @param {string} url - Image URL to download
 * @param {object} headers - Headers for the request (including Authorization)
 * @param {function} onProgress - Callback for progress updates (0-100)
 * @returns {Promise<string>} - Local file URI of the cached image
 */
export async function downloadImage(url, headers = {}, onProgress = null) {
  try {
    await ensureCacheDir();
    
    // Check cache first
    const index = await getCacheIndex();
    const cacheFilename = getCacheFilename(url);
    const cachedPath = CACHE_DIR + cacheFilename;
    
    if (index[url] && index[url] === cachedPath) {
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      if (fileInfo.exists) {
        console.log('✅ Image loaded from cache:', url);
        if (onProgress) onProgress(100);
        return cachedPath;
      }
    }
    
    // Not in cache, download it
    console.log('📥 Downloading image:', url);
    
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      cachedPath,
      { headers },
      (downloadProgress) => {
        const progress = Math.round(
          (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
        );
        if (onProgress) {
          onProgress(progress);
        }
      }
    );
    
    const result = await downloadResumable.downloadAsync();
    
    if (!result || !result.uri) {
      throw new Error('Download failed - no file received');
    }
    
    console.log('✅ Image downloaded:', result.uri);
    
    // Update cache index
    index[url] = result.uri;
    await saveCacheIndex(index);
    
    // Cleanup if cache is getting too large
    await cleanupCache();
    
    return result.uri;
  } catch (error) {
    console.error('❌ Image download error:', error);
    throw error;
  }
}

/**
 * Clear entire image cache
 */
export async function clearImageCache() {
  try {
    console.log('🧹 Clearing image cache...');
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    await AsyncStorage.removeItem(CACHE_INDEX_KEY);
    await ensureCacheDir();
    console.log('✅ Image cache cleared');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

/**
 * Get current cache statistics
 */
export async function getCacheStats() {
  try {
    const index = await getCacheIndex();
    const size = await getCacheSize();
    
    return {
      count: Object.keys(index).length,
      size,
      sizeMB: (size / (1024 * 1024)).toFixed(2),
      maxSizeMB: (MAX_CACHE_SIZE / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    console.error('❌ Error getting cache stats:', error);
    return { count: 0, size: 0, sizeMB: '0.00', maxSizeMB: '100.00' };
  }
}
