import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function toHttpTarget(rawValue, fallback) {
  const value = (rawValue || fallback).trim();

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `http://${value}`;
}

const usersTarget = toHttpTarget(process.env.USERS_SERVICE_URL, "http://localhost:3001");
const projectsTarget = toHttpTarget(
  process.env.PROJECTS_SERVICE_URL,
  "http://localhost:3002",
);

export default defineConfig({
  plugins: [react()],
  server: {
    // Railway assigns external *.up.railway.app hosts at runtime.
    // Allow all hosts so Vite doesn't block those requests.
    allowedHosts: true,
    port: 3000,
    proxy: {
      "/api/user-health": {
        target: usersTarget,
        changeOrigin: true,
        rewrite: () => "/health",
      },
      "/api/project-health": {
        target: projectsTarget,
        changeOrigin: true,
        rewrite: () => "/health",
      },
      "/api/users": {
        target: usersTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/projects": {
        target: projectsTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
