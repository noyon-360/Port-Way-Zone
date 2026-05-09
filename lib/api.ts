import axios from 'axios';
import Cookies from 'js-cookie';

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:5001/api';
const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:5000/api';

// --- Axios Instances ---

// 1. Auth API Instance (Microservice running on 5001)
export const authApi = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Core API Instance (Microservice running on 5000)
export const coreApi = axios.create({
  baseURL: CORE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
