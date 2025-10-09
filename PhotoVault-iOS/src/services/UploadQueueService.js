import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';

const QUEUE_KEY = '@upload_queue';
const MAX_RETRIES = 3;

class UploadQueueService {
  constructor() {
    this.isProcessing = false;
    this.listeners = [];
  }

  async addToQueue(photoUri, metadata = {}) {
    try {
      const queue = await this.getQueue();
      const item = {
        id: Date.now().toString(),
        photoUri,
        metadata,
        status: 'pending',
        retries: 0,
        createdAt: new Date().toISOString(),
      };

      queue.push(item);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      this.notifyListeners();

      this.processQueue();

      return item.id;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  async getQueue() {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  }

  async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const queue = await this.getQueue();
      const pendingItems = queue.filter(item => item.status === 'pending' || item.status === 'failed');

      for (const item of pendingItems) {
        await this.processItem(item);
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processItem(item) {
    try {
      await this.updateItemStatus(item.id, 'uploading');
      
      const result = await ApiService.uploadPhoto(item.photoUri, item.metadata);

      await this.updateItemStatus(item.id, 'completed', { result });
      
      setTimeout(() => this.removeItem(item.id), 5000);

      return result;
    } catch (error) {
      console.error('Error processing item:', error);

      if (item.retries < MAX_RETRIES) {
        await this.updateItem(item.id, {
          status: 'pending',
          retries: item.retries + 1,
        });
      } else {
        await this.updateItemStatus(item.id, 'failed', { error: error.message });
      }
    }
  }

  async updateItemStatus(itemId, status, extraData = {}) {
    await this.updateItem(itemId, { status, ...extraData });
  }

  async updateItem(itemId, updates) {
    try {
      const queue = await this.getQueue();
      const itemIndex = queue.findIndex(item => item.id === itemId);

      if (itemIndex !== -1) {
        queue[itemIndex] = { ...queue[itemIndex], ...updates };
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  }

  async removeItem(itemId) {
    try {
      const queue = await this.getQueue();
      const filteredQueue = queue.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
      this.notifyListeners();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  async clearCompleted() {
    try {
      const queue = await this.getQueue();
      const activeQueue = queue.filter(item => item.status !== 'completed');
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(activeQueue));
      this.notifyListeners();
    } catch (error) {
      console.error('Error clearing completed:', error);
    }
  }

  async retryFailed() {
    try {
      const queue = await this.getQueue();
      const updatedQueue = queue.map(item => {
        if (item.status === 'failed') {
          return { ...item, status: 'pending', retries: 0 };
        }
        return item;
      });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
      this.notifyListeners();
      this.processQueue();
    } catch (error) {
      console.error('Error retrying failed:', error);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  async getStats() {
    const queue = await this.getQueue();
    return {
      total: queue.length,
      pending: queue.filter(i => i.status === 'pending').length,
      uploading: queue.filter(i => i.status === 'uploading').length,
      completed: queue.filter(i => i.status === 'completed').length,
      failed: queue.filter(i => i.status === 'failed').length,
    };
  }
}

export default new UploadQueueService();
