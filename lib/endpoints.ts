/**
 * Centralized API endpoints configuration.
 * All paths are relative to their respective microservice baseURL.
 */

export const ENDPOINTS = {
  // Auth Microservice (prefixed with /api/auth in authApi)
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    ME: '/me',
  },
  
  // VPS Service (prefixed with /vps in api calls)
  VPS: {
    LIST: '/vps/list',
    SAVE: '/vps/save',
    UPDATE: '/vps/update',
    DELETE: '/vps/delete',
  },

  // Deployment Service
  DEPLOYMENTS: {
    LIST: '/deploy/list',
    STATUS: '/deploy/status',
  }
};
