import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'https://nexus-cfkp.onrender.com';
const api  = axios.create({ baseURL: BASE }); // Uso de la API REST propia

export const getMensajes   = (chatId) => api.get(`/api/messages/${encodeURIComponent(chatId)}`);
export const enviarMensaje = (data)   => api.post('/api/messages', data);
export const clearChat     = (chatId) => api.delete(`/api/messages/clear/${encodeURIComponent(chatId)}`);

export const getConversaciones  = (phone) => api.get(`/api/conversations?phone=${encodeURIComponent(phone)}`);
export const crearConversacion  = (data)  => api.post('/api/conversations', data);
export const actualizarConv     = (chatId, data) => api.patch(`/api/conversations/${encodeURIComponent(chatId)}`, data);

export const getGrupos  = (phone) => api.get(`/api/groups?phone=${encodeURIComponent(phone)}`);
export const crearGrupo = (data)  => api.post('/api/groups', data);

export const getEstados  = (phone) => api.get(`/api/status?phone=${encodeURIComponent(phone)}`);
export const crearEstado = (data)  => api.post('/api/status', data);