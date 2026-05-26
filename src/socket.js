import { io } from 'socket.io-client'; // Import de la API Socekt.io

const URL = import.meta.env.VITE_SOCKET_URL || 'https://nexus-cfkp.onrender.com';

const socket = io(URL, { // Uso de la API
    autoConnect: false,
    transports: ['websocket', 'polling'],
});

export default socket;