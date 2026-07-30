import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Vite config for the Poker Atlas tutorial app; pins the dev server to port 5194.
// Reason: Other apps in REPOS claim 5188/5190/5192, so 5194 keeps local dev servers from colliding.
export default defineConfig({
  plugins: [react()],
  cacheDir: ".vite",
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5194, strictPort: true },
});
