import axios from 'axios';
import { io } from 'socket.io-client';

// URL base de tu backend Express
const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// Instancia de Axios configurada
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia de Socket.io para tiempo real
export const socket = io(SOCKET_URL);

export default api;