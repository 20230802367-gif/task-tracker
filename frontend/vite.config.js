import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // BUG FIX #8: Proxy /api requests to the backend in dev mode
  // This avoids CORS issues during development — the browser talks to Vite (same origin)
  // and Vite forwards to Express. Remove the proxy when deploying to separate hosts.
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
