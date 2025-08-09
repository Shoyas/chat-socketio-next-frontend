"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // socket = io("http://localhost:4000", {
    // socket = io("http://10.0.30.40:4000", {
    // socket = io(`${process.env.DOMAIN_URL}`, {
    socket = io(`https://chat-socketio-express-backend.onrender.com`, {
      transports: ["websocket"], // prefer WS
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });
  }
  return socket;
}
