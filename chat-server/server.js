require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const helmet = require("helmet");

const Message = require("./models/Message");
const authRoutes = require("./Routes/authRoutes");
const userRoutes = require("./Routes/userRotes");
const uploadRoute = require("./Routes/uploadRoute");

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

/* ---------------- MIDDLEWARE ---------------- */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);


app.use(
  cors({
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
  })
);
app.use(express.json());
app.use(express.static("public"));



/* ---------------- DB ---------------- */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));

/* ---------------- API ROUTES ---------------- */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoute);

/* ---------------- SERVER + SOCKET ---------------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

/* ----------- ONLINE USERS TRACKING ----------- */
const onlineUsers = new Map(); // socketId -> username
const userSockets = new Map(); // username -> socketId

/* ----------- SOCKET AUTH MIDDLEWARE ----------- */
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const username = socket.handshake.auth.username;

  // Allow connection without token for testing
  if (!token && username) {
    socket.username = username;
    return next();
  }

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (username && decoded.username !== username) {
      return next(new Error("Invalid credentials"));
    }

    socket.username = decoded.username;
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

/* ----------- HELPERS ----------- */
function makeRoom(u1, u2) {
  return [u1, u2].sort().join("_");
}

async function getHistory(room) {
  const messages = await Message.find({ room })
    .sort({ ts: -1 })
    .limit(100)
    .lean();
  return messages.reverse();
}

/* ----------- SOCKET EVENTS ----------- */
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.username} (${socket.id})`);

  // Store user info
  onlineUsers.set(socket.id, socket.username);
  userSockets.set(socket.username, socket.id);

  // Broadcast online users to everyone
  io.emit("online_users", Array.from(onlineUsers.values()));

  /* --- TYPING --- */
  socket.on("typing", ({ from, to }) => {
    if (!from || !to) return;
    const room = makeRoom(from, to);
    socket.to(room).emit("typing", { from });
  });

  socket.on("stop_typing", ({ from, to }) => {
    if (!from || !to) return;
    const room = makeRoom(from, to);
    socket.to(room).emit("stop_typing");
  });

  /* --- JOIN PRIVATE ROOM --- */
  socket.on("join_private", async ({ from, to }) => {
    if (!from || !to) return;

    const room = makeRoom(from, to);
    socket.join(room);

    console.log(`${from} joined ${room}`);

    // mark seen
    await Message.updateMany(
      { room, seenBy: { $ne: from } },
      { $push: { seenBy: from } }
    );

    socket.to(room).emit("seen", { seenBy: from });

    const history = await getHistory(room);
    socket.emit("private_history", history);
  });

  /* --- SEND MESSAGE (Text or Image) --- */
  socket.on("private_message", async ({ from, to, text, type, imageUrl }) => {
    if (!from || !to) return;
    
    // Validate message content
    if (type === "image" && !imageUrl) return;
    if (type !== "image" && !text?.trim()) return;

    const room = makeRoom(from, to);

    // Create message object
    const messageData = {
      room,
      username: from,
      type: type || "text",
    };

    if (type === "image") {
      messageData.imageUrl = imageUrl;
      messageData.text = text || "";  
    } else {
      messageData.text = text;
    }

    const msg = await Message.create(messageData);

    // Emit to both users in the room
    io.to(room).emit("private_message", msg);

    // Mark as delivered
    await Message.findByIdAndUpdate(msg._id, {
      $addToSet: { deliveredTo: to },
    });

    socket.emit("delivered", { messageId: msg._id });

    // Send notification
    const recipientSocketId = userSockets.get(to);
    if (recipientSocketId) {
  io.to(recipientSocketId).emit("notification", {
  from,
  text: type === "image" ? "📷 Sent an image" : text,
  ts: Date.now(),
});

    }
  });

  /* --- DISCONNECT --- */
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.username}`);
    onlineUsers.delete(socket.id);
    userSockets.delete(socket.username);

    // Broadcast updated online users
    io.emit("online_users", Array.from(onlineUsers.values()));
  });
});

/* -------- API FOR MANUAL HISTORY (Protected) -------- */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
};

app.get("/history/:u1/:u2", authenticateToken, async (req, res) => {
  const room = makeRoom(req.params.u1, req.params.u2);
  const messages = await getHistory(room);
  res.json({ ok: true, messages });
});

/* -------- START SERVER -------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running → http://localhost:${PORT}`)
);  