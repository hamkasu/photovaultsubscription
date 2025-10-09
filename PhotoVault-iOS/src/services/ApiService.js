import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async login(email, password) {
    try {
      const response = await this.client.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async register(email, password, username) {
    try {
      const response = await this.client.post(API_ENDPOINTS.AUTH.REGISTER, {
        email,
        password,
        username,
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  async getProfile() {
    try {
      const response = await this.client.get(API_ENDPOINTS.AUTH.PROFILE);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadPhoto(photoUri, metadata = {}) {
    try {
      const formData = new FormData();
      
      const filename = photoUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: photoUri,
        name: filename,
        type,
      });

      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await this.client.post(API_ENDPOINTS.PHOTOS.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async detectAndExtractPhotos(photoUri) {
    try {
      const formData = new FormData();
      
      const filename = photoUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: photoUri,
        name: filename,
        type,
      });

      const response = await this.client.post(
        API_ENDPOINTS.PHOTOS.DETECT_AND_EXTRACT,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPhotos() {
    try {
      const response = await this.client.get(API_ENDPOINTS.PHOTOS.LIST);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDashboard() {
    try {
      const response = await this.client.get(API_ENDPOINTS.DASHBOARD);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return new Error(error.response.data.message || error.response.data.error || 'An error occurred');
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new ApiService();
