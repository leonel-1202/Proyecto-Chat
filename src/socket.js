import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
});

export default socket;