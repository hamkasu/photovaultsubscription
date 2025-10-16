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
  
  uploadAvatar: async (imageUri) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const fileType = filename.split('.').pop();
    
    formData.append('image', {
      uri: imageUri,
      name: `avatar.${fileType}`,
      type: `image/${fileType}`,
    });
    
    const response = await api.post('/api/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
  
  previewDetection: async (formData) => {
    const response = await api.post('/api/preview-detection', formData, {
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
  
  colorizePhoto: async (photoId, method = 'auto') => {
    const response = await api.post(`/api/photos/${photoId}/colorize`, { method });
    return response.data;
  },
  
  colorizePhotoAI: async (photoId) => {
    const response = await api.post(`/api/photos/${photoId}/colorize-ai`);
    return response.data;
  },
  
  sharpenPhoto: async (photoId, options = {}) => {
    const { intensity = 1.5, radius = 2.0, threshold = 3, method = 'unsharp' } = options;
    const response = await api.post(`/api/photos/${photoId}/sharpen`, { 
      intensity, 
      radius, 
      threshold, 
      method 
    });
    return response.data;
  },
  
  checkGrayscale: async (photoId) => {
    const response = await api.get(`/api/photos/${photoId}/check-grayscale`);
    return response.data;
  },
  
  deletePhoto: async (photoId) => {
    const response = await api.delete(`/api/photos/${photoId}`);
    return response.data;
  },
  
  bulkDeletePhotos: async (photoIds) => {
    const response = await api.post('/api/photos/bulk-delete-mobile', { photo_ids: photoIds });
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
  
  addPhotosToVaultBulk: async (vaultId, photoIds, caption = '') => {
    const response = await api.post(`/api/family/vault/${vaultId}/add-photos-bulk`, {
      photo_ids: photoIds,
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
  
  removePhotoFromVault: async (vaultId, photoId) => {
    const response = await api.delete(`/api/family/vault/${vaultId}/photos/${photoId}`);
    return response.data;
  },
  
  editVault: async (vaultId, name, description) => {
    const response = await api.patch(`/api/family/vault/${vaultId}`, {
      name,
      description,
    });
    return response.data;
  },
  
  deleteVault: async (vaultId) => {
    const response = await api.delete(`/api/family/vault/${vaultId}`);
    return response.data;
  },
  
  removeMember: async (vaultId, userId) => {
    const response = await api.delete(`/api/family/vault/${vaultId}/member/${userId}`);
    return response.data;
  },
  
  changeMemberRole: async (vaultId, userId, newRole) => {
    const response = await api.patch(`/api/family/vault/${vaultId}/member/${userId}/role`, {
      role: newRole,
    });
    return response.data;
  },
};

export const voiceMemoAPI = {
  getVoiceMemos: async (photoId) => {
    const response = await api.get(`/api/photos/${photoId}/voice-memos`);
    return response.data;
  },
  
  uploadVoiceMemo: async (photoId, audioUri, duration) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'voice-memo.m4a',
    });
    formData.append('duration', duration.toString());
    
    const response = await api.post(`/api/photos/${photoId}/voice-memos`, formData, {
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
  
  getAudioUrl: (memoId) => {
    return `${BASE_URL}/api/voice-memos/${memoId}/audio`;
  },
};

export const commentAPI = {
  getComments: async (photoId) => {
    const response = await api.get(`/api/photos/${photoId}/comments`);
    return response.data;
  },
  
  addComment: async (photoId, commentText) => {
    const response = await api.post(`/api/photos/${photoId}/comments`, {
      comment_text: commentText,
    });
    return response.data;
  },
  
  deleteComment: async (commentId) => {
    const response = await api.delete(`/api/comments/${commentId}`);
    return response.data;
  },
};

export default api;
