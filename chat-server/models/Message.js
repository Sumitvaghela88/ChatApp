// models/Message.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema({
  room: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, default: "" },
  ts: { type: Date, default: Date.now },
  deliveredTo: { type: [String], default: [] }, // store socketIds
  seenBy: { type: [String], default: [] }, // store socketIds
});

module.exports = mongoose.model("Message", messageSchema);
