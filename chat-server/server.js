require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const Message = require("./models/Message");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static("public"));

console.log("Loaded MONGODB_URI =", process.env.MONGODB_URI);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

/* ---------------- MONGO CONNECT ---------------- */
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

/* ---------------- HELPER ---------------- */
function makeRoom(u1, u2) {
  return [u1, u2].sort().join("_");
}

/* ---------------- HISTORY ---------------- */
async function getHistory(room) {
  try {
    const msgs = await Message.find({ room })
      .sort({ ts: -1 })
      .limit(100)
      .lean();
    return msgs.reverse();
  } catch (err) {
    return [];
  }
}

/* ---------------- SOCKET.IO ---------------- */
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  /* ---------- TYPING ---------- */
  socket.on("typing", ({ from, to }) => {
    const room = makeRoom(from, to);
    socket.to(room).emit("typing", { from });
  });

  socket.on("stop_typing", ({ from, to }) => {
    const room = makeRoom(from, to);
    socket.to(room).emit("stop_typing", { from });
  });

  /* ---------- JOIN PRIVATE ROOM ---------- */
  socket.on("join_private", async ({ from, to }) => {
    if (!from || !to) return;

    const room = makeRoom(from, to);
    socket.data.username = from;
    socket.join(room);

    console.log(`${from} joined room ${room}`);

    // ⭐ Mark all unread as SEEN
    await Message.updateMany(
      { room, seenBy: { $ne: from } },
      { $push: { seenBy: from } }
    );

    // ⭐ Notify the other user → blue ticks
    socket.to(room).emit("seen", { seenBy: from });

    // Send chat history
    const history = await getHistory(room);
    socket.emit("private_history", history);
  });

  /* ---------- SEND PRIVATE MESSAGE ---------- */
  socket.on("private_message", async ({ from, to, text }) => {
    if (!from || !to || !text.trim()) return;

    const room = makeRoom(from, to);

    const saved = await Message.create({
      room,
      username: from,
      text,
      ts: new Date(),
    });

    // Send message to both users
    io.to(room).emit("private_message", saved);

    // ⭐ Update deliveredTo in database
    await Message.findByIdAndUpdate(saved._id, {
      $addToSet: { deliveredTo: to }
    });

    // ⭐ Emit delivered tick ✔✔ white
    socket.emit("delivered", { messageId: saved._id });

    // ⭐ Send notification to recipient
    socket.to(room).emit("notification", {
      username: from,
      text,
      ts: Date.now(),
    });

    console.log(`Message: ${from} -> ${to} = ${text}`);
  });

  /* ---------- DISCONNECT ---------- */
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

/* ---------------- API: GET HISTORY ---------------- */
app.get("/history/:u1/:u2", async (req, res) => {
  const room = makeRoom(req.params.u1, req.params.u2);
  res.json({
    ok: true,
    messages: await getHistory(room),
  });
});

/* ---------------- START SERVER ---------------- */
server.listen(PORT, () => console.log("Server running on port", PORT));
