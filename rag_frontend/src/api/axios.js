import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' }
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  const username = localStorage.getItem('username');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  if (username) {
    config.headers['X-Username'] = username;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect, just reject the error
      // The app will handle auth state in the components
    }
    return Promise.reject(error);
  }
);

export default instance;
