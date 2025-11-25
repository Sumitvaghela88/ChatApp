// src/MessageInput.jsx
import React, { useState, useRef } from "react";
import { Stack, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { socket } from "./socket";

export default function MessageInput({ sendMessage, username, chatWith }) {
  const [text, setText] = useState("");
  const typingTimeout = useRef(null);

  const handleTyping = (value) => {
    setText(value);

    if (!username || !chatWith) return;

    socket.emit("typing", { from: username, to: chatWith });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { from: username, to: chatWith });
    }, 700);
  };

  const doSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText("");
    if (username && chatWith) socket.emit("stop_typing", { from: username, to: chatWith });
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  return (
    <Stack direction="row" spacing={1}>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Type a message..."
        value={text}
        onChange={(e) => handleTyping(e.target.value)}
        onKeyDown={onKey}
        size="small"
      />
      <IconButton color="primary" onClick={doSend}>
        <SendIcon />
      </IconButton>
    </Stack>
  );
}
