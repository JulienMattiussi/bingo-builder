import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env from root directory (one level up)
  const env = loadEnv(mode, path.resolve(__dirname, ".."), "");
  const port = parseInt(env.VITE_PORT) || 3000;
  const apiPort = parseInt(env.VITE_API_PORT) || 3001;

  return {
    plugins: [react()],
    server: {
      port: port,
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
