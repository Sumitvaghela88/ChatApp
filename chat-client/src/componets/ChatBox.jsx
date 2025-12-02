// ChatBox.jsx
import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";

export default function ChatBox({ messages = [], myUsername }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Box
      ref={scrollRef}
      sx={{
        height: "420px",
        overflowY: "auto",
        padding: "12px",
        background: "#0f1117",
      }}
    >
      {/* If no messages */}
      {messages.length === 0 && (
        <Typography color="gray" align="center" sx={{ mt: 5 }}>
          No messages yet — start the chat 👋
        </Typography>
      )}

      {/* Messages */}
      {messages.map((m, i) => {
        const isMe = m.username === myUsername;

        // ✔ WhatsApp ticks
        let tickIcon = null;
        if (isMe) {
          if (m.seen)
            tickIcon = <span style={{ color: "#53d3ff", marginLeft: 4 }}>✔✔</span>;
          else if (m.delivered || m.deliveredTo?.length > 0)
            tickIcon = <span style={{ color: "#e5e7eb", marginLeft: 4 }}>✔✔</span>;
          else
            tickIcon = <span style={{ color: "#e5e7eb", marginLeft: 4 }}>✔</span>;
        }

        return (
          <Box
            key={m._id || i}
            sx={{
              display: "flex",
              justifyContent: isMe ? "flex-end" : "flex-start",
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                maxWidth: "75%",
                padding: "10px 14px",
                borderRadius: "14px",
                background: isMe ? "#4caf50" : "#1f2937",
                color: isMe ? "white" : "#e5e7eb",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                animation: "fadeIn 0.2s ease",
              }}
            >
              {/* Show sender name for other user */}
              {!isMe && (
                <Typography sx={{ fontSize: "12px", color: "#9ca3af", mb: 0.5 }}>
                  {m.username}
                </Typography>
              )}

              {/* IMAGE MESSAGE - Direct Cloudinary URL */}
              {m.type === "image" && m.imageUrl && (
                <Box sx={{ mb: m.text ? 1 : 0 }}>
                  <img
                    src={m.imageUrl} // Direct Cloudinary URL
                    alt="sent"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      borderRadius: "8px",
                      display: "block",
                      cursor: "pointer",
                    }}
                    onClick={() => window.open(m.imageUrl, "_blank")}
                  />
                </Box>
              )}

              {/* TEXT MESSAGE or Caption */}
              {m.text && (
                <Typography sx={{ fontSize: "15px", whiteSpace: "pre-wrap" }}>
                  {m.text}
                </Typography>
              )}

              {/* TIME + TICK */}
              <Typography
                sx={{
                  fontSize: "11px",
                  color: isMe ? "#d1fae5" : "#9ca3af",
                  textAlign: "right",
                  mt: 0.8,
                }}
              >
                {new Date(m.ts).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {tickIcon}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}