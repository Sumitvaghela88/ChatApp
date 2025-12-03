
import React, { useState, useRef } from "react";
import {
  Stack,
  TextField,
  IconButton,
  CircularProgress,
  Box,
  Paper,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";
import { socket } from "./socket";

export default function MessageInput({
  sendMessage,
  username,
  chatWith,
  onTyping,
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  const handleTyping = (value) => {
    setText(value);
    if (!username || !chatWith) return;

    onTyping(true);

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 700);
  };

  const doSend = () => {
    if (!text.trim() && !imagePreview) return;

    if (imagePreview) {
      socket.emit("private_message", {
        from: username,
        to: chatWith,
        type: "image",
        imageUrl: imagePreview,
        text: text.trim(),
      });
      setImagePreview(null);
    } else {
      sendMessage(text.trim());
    }

    setText("");
    onTyping(false);
  };

  /* ---------------- IMAGE UPLOAD ---------------- */
  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return alert("Select an image.");

    if (file.size > 5 * 1024 * 1024)
      return alert("Max 5MB allowed.");

    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("http://localhost:5000/api/upload/image", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      setImagePreview(data.url);
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cancelImage = () => setImagePreview(null);

  return (
    <Box>
      {/* --------- IMAGE PREVIEW (Light Glass) ---------- */}
      {imagePreview && (
        <Paper
          elevation={0}
          sx={{
            mb: 1,
            p: 1.5,
            borderRadius: 3,
            display: "inline-block",
            position: "relative",

            /* Light liquid glass effect */
            background: "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}
        >
          <img
            src={imagePreview}
            alt="preview"
            style={{
              maxWidth: "200px",
              maxHeight: "200px",
              borderRadius: "12px",
              display: "block",
            }}
          />

          <IconButton
            size="small"
            onClick={cancelImage}
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              bgcolor: "rgba(255,255,255,0.7)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}

      {/* --------- INPUT + CAMERA + SEND ---------- */}
      <Paper
        elevation={0}
        sx={{
          p: 1.2,
          borderRadius: 3,

          /** Light Liquid Glass Bar */
          background: "rgba(255,255,255,0.35)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.6)",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {/* CAMERA BUTTON */}
          <IconButton component="label" disabled={uploading}>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={uploadImage}
            />
            {uploading ? <CircularProgress size={22} /> : <PhotoCameraIcon />}
          </IconButton>

          {/* TEXT FIELD — Light Glass */}
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={
              imagePreview
                ? "Add a caption..."
                : "Type a message..."
            }
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doSend();
              }
            }}
            size="small"
            disabled={uploading}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",

                /* Transparent input */
                background: "rgba(255,255,255,0.3)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.5)",

                "& fieldset": { border: "none" },
              },
            }}
          />

          {/* SEND BUTTON — neon blue */}
          <IconButton
            onClick={doSend}
            disabled={uploading || (!text.trim() && !imagePreview)}
            sx={{
              bgcolor: "rgba(90,200,250,0.25)",
              color: "#fff",
              border: "1px solid rgba(90,200,250,0.5)",
              boxShadow: "0 0 12px rgba(90,200,250,0.6)",
              "&:hover": {
                bgcolor: "rgba(90,200,250,0.4)",
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  );
}
