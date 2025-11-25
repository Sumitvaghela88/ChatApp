// ChatApp.jsx
import React, { useState, useEffect, useRef } from "react";
import { socket } from "./socket";
import JoinForm from "./JoinForm";
import ChatBox from "./ChatBox";
import MessageInput from "./MessageInput";

import {
  Box,
  Container,
  Paper,
  Typography,
  Divider,
  Avatar,
  IconButton,
  Button,
  useMediaQuery,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function makeRoom(u1, u2) {
  return [u1, u2].sort().join("_");
}

export default function ChatApp() {
  const [username, setUsername] = useState("");
  const [chatWith, setChatWith] = useState("");
  const [room, setRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);
  const [otherTyping, setOtherTyping] = useState("");
  const unreadRef = useRef(0);

  // Responsive check
  const isMobile = useMediaQuery("(max-width:768px)");

  // Ask for notification permission
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // SOCKET LISTENERS
  useEffect(() => {
    socket.on("private_history", (msgs) => setMessages(msgs || []));

    // 🔥 MESSAGE UPDATE FIX (NO DUPLICATION)
    socket.on("private_message", (msg) => {
      setMessages((prev) => {
        const exists = prev.find((m) => m._id === msg._id);
        if (exists) {
          return prev.map((m) => (m._id === msg._id ? msg : m));
        }
        return [...prev, msg];
      });
    });

    // delivered tick update
    socket.on("delivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, delivered: true } : m
        )
      );
    });

    // seen tick update
    socket.on("seen", ({ seenBy }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.username === username ? { ...m, seen: true } : m
        )
      );
    });

    // typing indicator
    socket.on("typing", ({ from }) => setOtherTyping(`${from} is typing...`));
    socket.on("stop_typing", () => setOtherTyping(""));

    // toast + browser notification
    socket.on("notification", (data) => {
      const el = document.createElement("div");
      el.className = "toast";
      el.innerText = `${data.username}: ${data.text}`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);

      if (document.hidden && Notification.permission === "granted") {
        new Notification(data.username, { body: data.text });
      }

      if (document.hidden) {
        unreadRef.current++;
        document.title = `(${unreadRef.current}) New Message`;
      }
    });

    // reset title on focus
    const reset = () => {
      unreadRef.current = 0;
      document.title = "Private Chat";
    };
    window.addEventListener("focus", reset);

    return () => {
      socket.off("private_history");
      socket.off("private_message");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("notification");
      socket.off("delivered");
      socket.off("seen");
      window.removeEventListener("focus", reset);
    };
  }, [username]);

  // Join private chat
  const joinPrivateChat = () => {
    if (!username.trim() || !chatWith.trim()) {
      return alert("Enter both usernames");
    }

    const rm = makeRoom(username, chatWith);
    setRoom(rm);

    socket.emit("join_private", { from: username, to: chatWith });

    setMessages([]); // clear old msgs
    setJoined(true);
  };

  // send message
  const sendMessage = (text) => {
    if (!text) return;
    socket.emit("private_message", {
      from: username,
      to: chatWith,
      text,
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
      <Paper
        elevation={8}
        sx={{
          display: "flex",
          minHeight: isMobile ? "88vh" : 600,
          position: "relative",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {/* LEFT SIDEBAR */}
        {!isMobile || !joined ? (
          <Box
            sx={{
              width: isMobile ? "100%" : 320,
              px: 2,
              py: 2,
              borderRight: isMobile ? "none" : "1px solid",
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "primary.main" }}>
                {username ? username.charAt(0).toUpperCase() : "U"}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {username || "Your Name"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {joined ? `Chatting with ${chatWith}` : "Not connected"}
                </Typography>
              </Box>

              <IconButton
                size="small"
                onClick={() =>
                  Notification.permission === "granted"
                    ? alert("Notifications enabled")
                    : Notification.requestPermission().then((r) =>
                        alert(`Notifications: ${r}`)
                      )
                }
              >
                <NotificationsActiveIcon />
              </IconButton>
            </Box>

            <Divider />

            {!joined ? (
              <JoinForm
                username={username}
                chatWith={chatWith}
                setUsername={setUsername}
                setChatWith={setChatWith}
                joinPrivateChat={joinPrivateChat}
              />
            ) : (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Room ID:
                </Typography>
                <Typography variant="caption">{room}</Typography>
              </Box>
            )}
          </Box>
        ) : null}

        {/* MESSAGE PANEL */}
        {(!isMobile || joined) && (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Mobile Back Button */}
            {isMobile && joined && (
              <Button
                startIcon={<ArrowBackIcon />}
                sx={{ textTransform: "none", mt: 1, ml: 1 }}
                onClick={() => setJoined(false)}
              >
                Back
              </Button>
            )}

            {/* Header */}
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar sx={{ bgcolor: "secondary.main" }}>
                {chatWith ? chatWith.charAt(0).toUpperCase() : "?"}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700}>
                  {chatWith || "No chat selected"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {joined ? "Private chat" : "Start a chat"}
                </Typography>
              </Box>
            </Box>

            {/* CHAT MESSAGES */}
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <ChatBox messages={messages} myUsername={username} />
            </Box>

            {/* TYPING */}
            {otherTyping && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 2, mt: 1 }}
              >
                {otherTyping}
              </Typography>
            )}

            {/* SEND BOX */}
            <Box sx={{ px: 2, py: 2 }}>
              <MessageInput
                sendMessage={sendMessage}
                username={username}
                chatWith={chatWith}
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
