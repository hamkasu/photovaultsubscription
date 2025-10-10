import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://web-production-535bd.up.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  
  register: async (username, email, password) => {
    const response = await api.post('/api/auth/register', { 
      username, 
      email, 
      password 
    });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
};

export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/api/dashboard');
    return response.data;
  },
};

export const photoAPI = {
  getPhotos: async (filter = 'all') => {
    const response = await api.get(`/api/photos?filter=${filter}`);
    return response.data;
  },
  
  getPhotoDetail: async (photoId) => {
    const response = await api.get(`/api/photos/${photoId}`);
    return response.data;
  },
  
  uploadPhoto: async (formData) => {
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  detectAndExtract: async (formData) => {
    const response = await api.post('/api/detect-and-extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  enhancePhoto: async (photoId, options) => {
    const response = await api.post(`/api/photos/${photoId}/enhance`, options);
    return response.data;
  },
  
  colorizePhoto: async (photoId) => {
    const response = await api.post(`/api/photos/${photoId}/colorize`);
    return response.data;
  },
  
  deletePhoto: async (photoId) => {
    const response = await api.delete(`/api/photos/${photoId}`);
    return response.data;
  },
  
  getAIMetadata: async (photoId) => {
    const response = await api.get(`/api/photos/${photoId}/ai-metadata`);
    return response.data;
  },
};

export const vaultAPI = {
  getVaults: async () => {
    const response = await api.get('/api/family/vaults');
    return response.data;
  },
  
  getVaultDetail: async (vaultId) => {
    const response = await api.get(`/api/family/vault/${vaultId}`);
    return response.data;
  },
  
  addPhotoToVault: async (vaultId, photoId, caption) => {
    const response = await api.post(`/api/family/vault/${vaultId}/add-photo`, {
      photo_id: photoId,
      caption,
    });
    return response.data;
  },
  
  createVault: async (name, description) => {
    const response = await api.post('/api/family/vaults', { name, description });
    return response.data;
  },
  
  inviteMember: async (vaultId, email, role) => {
    const response = await api.post(`/api/family/vault/${vaultId}/invite`, {
      email,
      role,
    });
    return response.data;
  },
};

export const voiceMemoAPI = {
  getVoiceMemos: async (photoId) => {
    const response = await api.get(`/api/voice-memos/${photoId}`);
    return response.data;
  },
  
  uploadVoiceMemo: async (photoId, audioUri) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'voice-memo.m4a',
    });
    
    const response = await api.post(`/api/voice-memos/${photoId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  deleteVoiceMemo: async (memoId) => {
    const response = await api.delete(`/api/voice-memos/${memoId}`);
    return response.data;
  },
};

export default api;
