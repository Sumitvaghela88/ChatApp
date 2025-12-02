// socket.js
import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  autoConnect: false, // Manual connect after authentication
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connection error handling
socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message);
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});