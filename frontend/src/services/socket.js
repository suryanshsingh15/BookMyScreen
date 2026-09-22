import { io } from "socket.io-client";

// LEVEL: ADVANCED → single shared socket connection used by the seat selection page.
// We create it lazily (only when first needed) rather than connecting on app load,
// since most pages never need a live socket connection.
let socket = null;

export const getSocket = () => {
  if (!socket) {
    const url = import.meta.env.VITE_SOCKET_URL || "/";
    socket = io(url, { autoConnect: true, transports: ["websocket", "polling"] });
  }
  return socket;
};
