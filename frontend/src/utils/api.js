import axios from 'axios';
import toast from 'react-hot-toast';

// Determine API URL based on environment
const getApiUrl = () => {
  // Check for backend URL (production)
  if (import.meta.env.VITE_BACKEND_URL) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    return backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`;
  }
  // Check for API URL (fallback)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default: use relative path (works with Vite proxy in dev, same-origin in prod)
  return '/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Track if we're already refreshing to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  isRefreshing = false;
  failedQueue = [];
};

// Handle responses globally
api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status;
    const originalRequest = err.config;

    // If 401 and we have refresh token, try to refresh
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        return api
          .post('/auth/refresh-token', { refreshToken })
          .then(res => {
            const newAccessToken = res.data.accessToken;
            const newRefreshToken = res.data.refreshToken;
            localStorage.setItem('access_token', newAccessToken);
            localStorage.setItem('refresh_token', newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            return api(originalRequest);
          })
          .catch(err => {
            processQueue(err, null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(err);
          });
      }

      // No refresh token available
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (status === 403) {
      toast.error('You do not have permission to do that.');
    }
    if (status === 422) {
      /* let form handle validation errors */
    }
    if (status >= 500) {
      toast.error('Server error. Please try again.');
    }

    return Promise.reject(err);
  }
);

export default api;
