import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_SOCKET_URL ?? "http://127.0.0.1:4000", {
  autoConnect: true
});
