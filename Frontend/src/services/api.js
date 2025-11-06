import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const instance = axios.create({ baseURL: API, timeout: 15000 });

instance.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default instance;
