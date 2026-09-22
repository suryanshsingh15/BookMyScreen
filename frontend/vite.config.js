import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// LEVEL: BASIC — Vite dev server config.
// The proxy forwards /api/* calls to the backend during local dev so the
// frontend can just call fetch("/api/movies") without hardcoding a host.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
});
