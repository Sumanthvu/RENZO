import axios from 'axios';

const axiosClient = axios.create({
  // Vite uses import.meta.env instead of process.env
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/users', 
  withCredentials: true, // Crucial: This forces the browser to send/receive JWT cookies
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;