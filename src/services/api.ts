import axios from 'axios';
import { useAppStore } from '../store/appStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach Firebase ID Token or X-Demo-Role header to every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    const store = useAppStore.getState();
    if (store.isDemoMode && store.user) {
      config.headers['X-Demo-Role'] = store.user.role;
      config.headers['X-Demo-Site'] = '1';
    }
    if (store.firebaseToken) {
      config.headers.Authorization = `Bearer ${store.firebaseToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized request - session may have expired.');
    }
    return Promise.reject(error);
  }
);

export const api = {
  getHealth: () => apiClient.get('/health'),
  getSites: () => apiClient.get('/sites'),
  getVehicles: (siteId: string | number) => apiClient.get(`/sites/${siteId}/vehicles`),
  getSensors: (siteId: string | number) => apiClient.get(`/sites/${siteId}/sensors`),
  getAlerts: (siteId: string | number) => apiClient.get(`/sites/${siteId}/alerts`),
  getWeather: (siteId: string | number) => apiClient.get(`/sites/${siteId}/weather`),
};

