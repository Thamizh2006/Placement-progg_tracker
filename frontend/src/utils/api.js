import axios from 'axios';

const appBaseUrl = import.meta.env.BASE_URL || '/';
const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const normalizeApiBaseUrl = (value = '') => {
  const normalizedValue = trimTrailingSlash(value);

  if (!normalizedValue) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith('http') && !normalizedValue.endsWith('/api')) {
    return `${normalizedValue}/api`;
  }

  return normalizedValue;
};

const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
  }

  if (import.meta.env.DEV) {
    return `http://${import.meta.env.VITE_API_PROXY_HOST || 'localhost'}:${
      import.meta.env.VITE_API_PROXY_PORT || '3000'
    }/api`;
  }

  return '/api';
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = `${appBaseUrl}login`;
    }
    return Promise.reject(error);
  }
);

export default api;
