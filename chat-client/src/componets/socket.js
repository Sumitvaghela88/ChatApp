// socket.js
import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// store callbacks coming from React
let handlers = {};

// Called from ChatApp to register event callbacks
export function registerSocketHandlers(h) {
  handlers = h;
}

/* ------------ BASIC CONNECTION LOGS ------------- */
socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message);
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

/* ------------ ALL SOCKET LISTENERS ------------- */
// Runs once — never re-register inside React again

socket.on("private_history", (msgs) => {
  handlers.onPrivateHistory?.(msgs);
});

socket.on("private_message", (msg) => {
  handlers.onPrivateMessage?.(msg);
});

socket.on("delivered", (data) => {
  handlers.onDelivered?.(data);
});

socket.on("seen", (data) => {
  handlers.onSeen?.(data);
});

socket.on("typing", (data) => {
  handlers.onTyping?.(data);
});

socket.on("stop_typing", (data) => {
  handlers.onStopTyping?.(data);
});

socket.on("online_users", (users) => {
  handlers.onOnlineUsers?.(users);
});

socket.on("notification", (data) => {
  handlers.onNotification?.(data);
});
