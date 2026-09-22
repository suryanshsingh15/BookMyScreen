import axios from "axios";

// LEVEL: BASIC → central place all API calls go through.
// Vite's dev proxy (vite.config.js) forwards "/api" to the backend, so baseURL
// can just be "/api" in development. In production, set VITE_API_URL to your
// deployed backend URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach the JWT to every request automatically, if we have one stored.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
