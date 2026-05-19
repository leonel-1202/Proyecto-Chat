import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api  = axios.create({ baseURL: BASE });

export const getMensajes   = (chatId) => api.get(`/messages/${encodeURIComponent(chatId)}`);
export const enviarMensaje = (data)   => api.post('/messages', data);

export const getConversaciones = (phone) =>
  api.get(`/conversations?phone=${encodeURIComponent(phone)}`);

export const crearConversacion = (data) => api.post('/conversations', data);

export const actualizarConversacion = (chatId, data) =>
  api.patch(`/conversations/${encodeURIComponent(chatId)}`, data);

export const getGrupos  = (phone) => api.get(`/groups?phone=${encodeURIComponent(phone)}`);
export const crearGrupo = (data)  => api.post('/groups', data);

export const getEstados  = (phone) => api.get(`/status?phone=${encodeURIComponent(phone)}`);
export const crearEstado = (data)  => api.post('/status', data);