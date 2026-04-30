import axios, { type AxiosInstance } from 'axios';

/**
 * Axios instance configured for API requests.
 * @constant
 */
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 20000,
});

export default api;