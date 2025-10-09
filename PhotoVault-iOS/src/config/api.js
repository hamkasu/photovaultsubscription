export const API_CONFIG = {
  BASE_URL: 'https://web-production-535bd.up.railway.app',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile',
  },
  PHOTOS: {
    UPLOAD: '/api/upload',
    LIST: '/api/photos',
    DETECT_AND_EXTRACT: '/api/detect-and-extract',
  },
  DASHBOARD: '/api/dashboard',
};
