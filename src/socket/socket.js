import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

// Instantiate Socket.IO connection
export const socket = io(SOCKET_URL, {
  autoConnect: true
});
