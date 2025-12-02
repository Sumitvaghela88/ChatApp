// ChatApp.jsx - Liquid Glass Full UI Version
import React, { useState, useEffect, useRef } from "react";
import { socket } from "./socket";
import AuthForm from "./AuthFrom";
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
  Menu,
  MenuItem,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";

function makeRoom(u1, u2) {
  return [u1, u2].sort().join("_");
}

export default function ChatApp() {
  const [user, setUser] = useState(null);
  const [chatWith, setChatWith] = useState("");
  const [room, setRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);
  const [otherTyping, setOtherTyping] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const isMobile = useMediaQuery("(max-width:768px)");

  /* ---------------- SOCKET ---------------- */
  const connectSocket = (username, token = null) => {
    socket.auth = token ? { username, token } : { username };
    if (socket.connected) socket.disconnect();
    socket.connect();
  };

  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData);
    connectSocket(userData.username, userToken);
  };

  const handleLogout = () => {
    socket.disconnect();
    setUser(null);
    setJoined(false);
    setMessages([]);
    setChatWith("");
    setOnlineUsers([]);
  };

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  /* ---------------- SOCKET LISTENERS ---------------- */
  useEffect(() => {
    if (!user) return;

    socket.on("private_history", (msgs) => setMessages(msgs || []));

    socket.on("private_message", (msg) => {
      setMessages((prev) => {
        const exists = prev.find((m) => m._id === msg._id);
        if (exists) {
          return prev.map((m) => (m._id === msg._id ? msg : m));
        }
        return [...prev, msg];
      });
    });

    socket.on("delivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, delivered: true } : m
        )
      );
    });

    socket.on("seen", () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.username === user.username ? { ...m, seen: true } : m
        )
      );
    });

    socket.on("typing", ({ from }) => setOtherTyping(`${from} is typing...`));
    socket.on("stop_typing", () => setOtherTyping(""));

    socket.on("online_users", (users) => {
      setOnlineUsers(users.filter((u) => u !== user.username));
    });

    socket.on("notification", (data) => {
      if (document.hidden && Notification.permission === "granted") {
        new Notification(data.username, { body: data.text });
      }
    });

    return () => {
      socket.off("private_history");
      socket.off("private_message");
      socket.off("delivered");
      socket.off("seen");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("online_users");
      socket.off("notification");
    };
  }, [user]);

  /* ---------------- JOIN CHAT ---------------- */
  const joinPrivateChat = (username) => {
    setChatWith(username);
    setRoom(makeRoom(user.username, username));
    socket.emit("join_private", { from: user.username, to: username });
    setMessages([]);
    setJoined(true);
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = (text) => {
    if (!text || !chatWith) return;
    socket.emit("private_message", {
      from: user.username,
      to: chatWith,
      text,
    });
  };

  /* ---------------- TYPING ---------------- */
  const handleTyping = (isTyping) => {
    if (!chatWith) return;
    if (isTyping)
      socket.emit("typing", { from: user.username, to: chatWith });
    else socket.emit("stop_typing", { from: user.username, to: chatWith });
  };

  /* ---------------- AUTH SCREEN ---------------- */
  if (!user) return <AuthForm onAuthSuccess={handleAuthSuccess} />;

  /* ---------------- MAIN UI (Glass) ---------------- */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 3,

        /** BACKGROUND */
        background:
          "linear-gradient(135deg, #0b0f19 0%, #111827 40%, #0d1117 100%)",
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            minHeight: isMobile ? "88vh" : 600,
            flexDirection: isMobile ? "column" : "row",
            borderRadius: 4,

            /** FULL LIQUID GLASS STYLE */
            background: "rgba(255, 255, 255, 0.07)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            boxShadow:
              "0 8px 35px rgba(0,0,0,0.4), inset 0 0 25px rgba(255,255,255,0.05)",
          }}
        >
          {/* ---------------- SIDEBAR ---------------- */}
          {!isMobile || !joined ? (
            <Box
              sx={{
                width: isMobile ? "100%" : 300,
                px: 2,
                py: 2,
                borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.15)",

                /** Sidebar Glass */
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
                borderRadius: isMobile ? "0" : "20px 0 0 20px",
              }}
            >
              {/* Profile Header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    boxShadow: "0 0 10px rgba(90,200,250,0.4)",
                  }}
                >
                  {user.username[0].toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700} color="#fff">
                    {user.username}
                  </Typography>

                  <Typography variant="caption" color="rgba(255,255,255,0.5)">
                    {joined ? `Chatting with ${chatWith}` : "Select a user"}
                  </Typography>
                </Box>

                <IconButton
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  sx={{ color: "#fff" }}
                >
                  <MoreVertIcon />
                </IconButton>

                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                >
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 1 }} /> Logout
                  </MenuItem>
                </Menu>
              </Box>

              <Divider
                sx={{
                  my: 2,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              />

              {/* Online users */}
              <Typography
                fontWeight={600}
                sx={{ mb: 1 }}
                color="rgba(255,255,255,0.8)"
              >
                Online Users ({onlineUsers.length})
              </Typography>

              <List sx={{ maxHeight: 400, overflow: "auto" }}>
                {onlineUsers.length === 0 ? (
                  <Typography color="gray" sx={{ px: 2 }}>
                    No users online
                  </Typography>
                ) : (
                  onlineUsers.map((name) => (
                    <ListItemButton
                      key={name}
                      onClick={() => joinPrivateChat(name)}
                      selected={chatWith === name}
                      sx={{
                        borderRadius: 2,
                        "&.Mui-selected": {
                          background: "rgba(90,200,250,0.18)",
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "secondary.main" }}>
                          {name[0].toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={name}
                        primaryTypographyProps={{ color: "#fff" }}
                      />
                    </ListItemButton>
                  ))
                )}
              </List>
            </Box>
          ) : null}

          {/* ---------------- CHAT PANEL ---------------- */}
          {(!isMobile || joined) && (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(10px)",
                borderRadius: isMobile ? "0 0 20px 20px" : "0 20px 20px 0",
              }}
            >
              {isMobile && joined && (
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setJoined(false)}
                  sx={{ textTransform: "none", mt: 1, ml: 1, color: "#fff" }}
                >
                  Back
                </Button>
              )}

              {/* Header */}
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: "1px solid rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Avatar sx={{ bgcolor: "secondary.main" }}>
                  {chatWith ? chatWith[0].toUpperCase() : "?"}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700} color="#fff">
                    {chatWith || "No chat selected"}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.6)">
                    {joined ? "Private chat" : "Start chat"}
                  </Typography>
                </Box>
              </Box>

              {/* Messages */}
              <ChatBox messages={messages} myUsername={user.username} />

              {otherTyping && (
                <Typography sx={{ px: 2, color: "gray", mt: 1 }}>
                  {otherTyping}
                </Typography>
              )}

              {joined && (
                <Box sx={{ px: 2, py: 2 }}>
                  <MessageInput
                    sendMessage={sendMessage}
                    username={user.username}
                    chatWith={chatWith}
                    onTyping={handleTyping}
                  />
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
