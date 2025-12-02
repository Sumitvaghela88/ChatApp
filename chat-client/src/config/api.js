// config/api.js
export const API_BASE_URL = "http://localhost:5000/api";

// API endpoints
export const endpoints = {
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  verify: `${API_BASE_URL}/auth/verify`,
  users: `${API_BASE_URL}/users`,
  searchUsers: `${API_BASE_URL}/users/search`,
   uploadImage: `${API_BASE_URL}/upload/image`,
};