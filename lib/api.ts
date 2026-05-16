import axios from 'axios';
import Cookies from 'js-cookie';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8888';

// --- Axios Instances ---
export const api = axios.create({
  baseURL: GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth specific instance (prefixed with /api/auth)
export const authApi = axios.create({
  baseURL: `${GATEWAY_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const coreApi = api;

// --- Interceptors ---

// Attach token to authApi requests
authApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Attach token to coreApi requests
coreApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
