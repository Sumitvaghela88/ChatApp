// models/Message.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  room: { type: String, required: true, index: true },
  username: { type: String, required: true },
  text: { type: String, default: "" },
  type: { type: String, enum: ["text", "image"], default: "text" },
  imageUrl: { type: String },
  ts: { type: Date, default: Date.now },
  deliveredTo: [{ type: String }],
  seenBy: [{ type: String }],
});

module.exports = mongoose.model("Message", MessageSchema);