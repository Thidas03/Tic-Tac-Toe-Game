import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:5000" : window.location.origin);

// Instantiate Socket.IO connection
export const socket = io(SOCKET_URL, {
  autoConnect: true
});

