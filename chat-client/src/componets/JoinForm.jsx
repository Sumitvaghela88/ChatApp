// src/JoinForm.jsx
import React from "react";
import { TextField, Button, Stack } from "@mui/material";

export default function JoinForm({
  username,
  chatWith,
  setUsername,
  setChatWith,
  joinPrivateChat
}) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Your Name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        size="small"
      />

      <TextField
        label="Chat With (username)"
        value={chatWith}
        onChange={(e) => setChatWith(e.target.value)}
        fullWidth
        size="small"
      />

      <Button variant="contained" fullWidth onClick={joinPrivateChat}>
        Start Private Chat
      </Button>
    </Stack>
  );
}
