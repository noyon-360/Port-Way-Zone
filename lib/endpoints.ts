/**
 * Centralized API endpoints configuration.
 * This makes it easy to manage all routes in one place.
 */

export const ENDPOINTS = {
  // Auth Microservice (port 5001)
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  
  // Core Microservice (port 5000)
  CLIENTS: {
    GET_ALL: '/clients',
    CREATE: '/clients',
  },
  DEPLOYMENTS: {
    GET_ALL: '/deployments',
    STATUS: '/deployments/status',
  }
};
