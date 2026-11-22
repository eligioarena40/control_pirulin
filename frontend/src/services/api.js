import axios from 'axios';
import { io } from 'socket.io-client';

// URL base de tu backend Express
const API_URL = import.meta.env.VITE_API_URL || "https://control-pirulin.onrender.com";
const SOCKET_URL = import.meta.env.VITE_API_URL || "https://control-pirulin.onrender.com";

// Instancia de Axios configurada
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adjuntar automáticamente el JWT en cada petición si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Manejar sesión expirada o no autorizada (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.dispatchEvent(new Event('pirulin:sesion-expirada'));
    }
    return Promise.reject(error);
  }
);

// Instancia de Socket.io para tiempo real
export const socket = io(SOCKET_URL);

export default api;