import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../stores/authStore';
import { API_ENDPOINTS } from '../constants/api.endpoints';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

const isAuthRequest = (url?: string) => url === API_ENDPOINTS.auth.login || url?.includes('/auth/refresh');

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest(originalRequest.url)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { token } = res.data.data;

        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          processQueue(new Error('No user in store'), null);
          message.error('Your session expired, please log in again.');
          useAuthStore.getState().logout();
          setTimeout(() => { window.location.href = '/'; }, 500);
          return Promise.reject(new Error('No user in store'));
        }

        useAuthStore.getState().login(currentUser, token);

        processQueue(null, token);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        message.error('Your session expired, please log in again.');
        useAuthStore.getState().logout();
        setTimeout(() => { window.location.href = '/'; }, 500);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
