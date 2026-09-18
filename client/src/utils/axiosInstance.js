import axios from 'axios';

// Normalize URL to always end with /api
const normalizeUrl = (url) => {
  if (!url) return '';
  const clean = url.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

// List of configured backends (Primary and Backup URLs)
const getBackendUrls = () => {
  const envPrimary = import.meta.env.VITE_API_URL;
  const envBackup = import.meta.env.VITE_BACKUP_API_URL;
  
  const rawUrls = [
    envPrimary,
    envBackup,
    'https://sockwise-nlcf.onrender.com/api',
    'https://sockwise.onrender.com/api',
  ].filter(Boolean);
  
  const uniqueUrls = [...new Set(rawUrls.map(normalizeUrl))];

  // Sort: Move known suspended domain to the end so active backend is tried first
  return uniqueUrls.sort((a, b) => {
    const isASuspended = a.includes('sockwise.onrender.com') && !a.includes('sockwise-nlcf');
    const isBSuspended = b.includes('sockwise.onrender.com') && !b.includes('sockwise-nlcf');
    if (isASuspended && !isBSuspended) return 1;
    if (!isASuspended && isBSuspended) return -1;
    return 0;
  });
};

const backendUrls = getBackendUrls();

// Retrieve previously working backend index from sessionStorage or default to 0
let currentUrlIndex = parseInt(sessionStorage.getItem('activeBackendIndex') || '0', 10);
if (isNaN(currentUrlIndex) || currentUrlIndex >= backendUrls.length) {
  currentUrlIndex = 0;
}

const getActiveBaseURL = () => {
  if (import.meta.env.DEV) {
    return '/api';
  }
  return backendUrls[currentUrlIndex] || backendUrls[0] || '/api';
};

const axiosInstance = axios.create({
  baseURL: getActiveBaseURL(),
  timeout: 15000, // 15-second timeout to quickly catch unresponsive/suspended backends
});

// Switch active backend URL to the next available backend
const switchToNextBackend = () => {
  if (backendUrls.length <= 1) return axiosInstance.defaults.baseURL;
  currentUrlIndex = (currentUrlIndex + 1) % backendUrls.length;
  sessionStorage.setItem('activeBackendIndex', currentUrlIndex.toString());
  const newBaseURL = backendUrls[currentUrlIndex];
  axiosInstance.defaults.baseURL = newBaseURL;
  console.warn(`[SockWise Auto-Failover] Switched active backend to: ${newBaseURL}`);
  return newBaseURL;
};

// Check if error response indicates the server is suspended or down
const isServerDownOrSuspended = (error) => {
  if (!error.response) {
    // Network Error or Timeout
    return true;
  }
  const status = error.response.status;
  // Service Unavailable (503), Bad Gateway (502), Gateway Timeout (504)
  if ([502, 503, 504].includes(status)) {
    return true;
  }
  // Render suspended message response
  if (typeof error.response.data === 'string' && error.response.data.toLowerCase().includes('suspended')) {
    return true;
  }
  return false;
};

// Request interceptor to attach Authorization token
axiosInstance.interceptors.request.use(
  (config) => {
    // Update baseURL dynamically in case it changed
    if (!import.meta.env.DEV && backendUrls.length > 0) {
      config.baseURL = backendUrls[currentUrlIndex] || config.baseURL;
    }
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with 401 handling & automatic backend failover
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Automatic Failover: if current backend is down/suspended, retry on backup backend
    if (isServerDownOrSuspended(error) && originalRequest && !originalRequest._retryFailover) {
      originalRequest._retryFailover = true;
      const nextBaseURL = switchToNextBackend();
      
      // If we have another backend to try, retry request with new base URL
      if (backendUrls.length > 1) {
        console.log(`[SockWise Auto-Failover] Retrying request on fallback backend: ${nextBaseURL}`);
        originalRequest.baseURL = nextBaseURL;
        return axiosInstance(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

