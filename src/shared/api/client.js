/**
 * Shared API Client
 * Centralizes API calls with consistent error handling and authentication
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Build request headers with authentication
 */
const buildHeaders = (customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.message || 'API request failed');
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

/**
 * Main API client methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get: async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: buildHeaders(options.headers),
      ...options,
    });
    return handleResponse(response);
  },

  /**
   * POST request
   */
  post: async (endpoint, data, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(options.headers),
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse(response);
  },

  /**
   * PUT request
   */
  put: async (endpoint, data, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: buildHeaders(options.headers),
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse(response);
  },

  /**
   * PATCH request
   */
  patch: async (endpoint, data, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: buildHeaders(options.headers),
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse(response);
  },

  /**
   * DELETE request
   */
  delete: async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: buildHeaders(options.headers),
      ...options,
    });
    return handleResponse(response);
  },
};

export default apiClient;

