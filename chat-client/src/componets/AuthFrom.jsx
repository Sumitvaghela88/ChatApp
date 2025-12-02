// AuthForm.jsx
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  Paper,
} from '@mui/material';
import { Visibility, VisibilityOff, ChatBubble } from '@mui/icons-material';
import { endpoints } from '../config/api';

export default function AuthForm({ onAuthSuccess }) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(endpoints.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (registerData.password !== registerData.confirmPassword)
      return setError('Passwords do not match');
    if (registerData.password.length < 6)
      return setError('Minimum 6 characters');
    if (registerData.username.length < 3)
      return setError('Username too short');

    setLoading(true);

    try {
      const response = await fetch(endpoints.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerData.username.toLowerCase(),
          email: registerData.email,
          password: registerData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background:
          "url('https://images.unsplash.com/photo-1529612700005-e35377bf1415?auto=format&fit=crop&w=1500&q=80') center/cover",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Smooth Liquid Gradient Overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(115deg, rgba(0,0,0,0.65), rgba(0,0,0,0.35))',
          zIndex: 0,
        }}
      />

      <Paper
        elevation={0}
        sx={{
          maxWidth: 420,
          width: '100%',
          p: 4,
          borderRadius: 4,
          position: 'relative',
          zIndex: 2,

          // GLASS EFFECT
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow:
            '0 8px 25px rgba(0,0,0,0.35), inset 0 0 25px rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <ChatBubble
            sx={{
              fontSize: 56,
              color: '#fff',
              textShadow: '0 0 12px #5ac8fa',
            }}
          />
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              mt: 1,
              color: '#fff',
              textShadow: '0 0 15px rgba(255,255,255,0.4)',
            }}
          >
            Private Chat
          </Typography>
          <Typography color="rgba(255,255,255,0.7)">
            Secure Messaging for Everyone
          </Typography>
        </Box>

        {/* Glass Tabs */}
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          centered
          textColor="inherit"
          TabIndicatorProps={{
            sx: {
              backgroundColor: '#5ac8fa',
              height: 3,
              borderRadius: 2,
              boxShadow: '0 0 10px #5ac8fa',
            },
          }}
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600,
              fontSize: '16px',
            },
          }}
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              background: 'rgba(255,0,0,0.15)',
              borderRadius: 2,
              color: '#fff',
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {/* FORM UI */}
        <Box sx={{ color: '#fff' }}>
          {/* LOGIN */}
          {tab === 0 && (
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                sx={{
                  mb: 2,
                  input: { color: '#fff' },
                  label: { color: 'rgba(255,255,255,0.7)' },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                sx={{
                  mb: 3,
                  input: { color: '#fff' },
                  label: { color: 'rgba(255,255,255,0.7)' },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#fff' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{
                  py: 1.4,
                  fontSize: '16px',
                  borderRadius: 3,
                  background:
                    'linear-gradient(135deg, #5ac8fa, #3a7bd5, #6f86d6)',
                  boxShadow: '0 0 15px rgba(90,200,250,0.7)',
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </form>
          )}

          {/* REGISTER */}
          {tab === 1 && (
            <form onSubmit={handleRegister}>
              <TextField
                fullWidth
                label="Username"
                required
                value={registerData.username}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    username: e.target.value,
                  })
                }
                sx={{
                  mb: 2,
                  input: { color: '#fff' },
                  label: { color: 'rgba(255,255,255,0.7)' },
                }}
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData({ ...registerData, email: e.target.value })
                }
                sx={{
                  mb: 2,
                  input: { color: '#fff' },
                  label: { color: 'rgba(255,255,255,0.7)' },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    password: e.target.value,
                  })
                }
                sx={{
                  mb: 2,
                  input: { color: '#fff' },
                  label: { color: 'rgba(255,255,255,0.7)' },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        sx={{ color: '#fff' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={registerData.confirmPassword}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    confirmPassword: e.target.value,
                  })
                }
                sx={{
                  mb: 3,
                  input: { color: '#fff' },
                  label: { color: 'rgba(255,255,255,0.7)' },
                }}
              />

              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{
                  py: 1.4,
                  fontSize: '16px',
                  borderRadius: 3,
                  background:
                    'linear-gradient(135deg, #5ac8fa, #3a7bd5, #6f86d6)',
                  boxShadow: '0 0 15px rgba(90,200,250,0.7)',
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            </form>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
