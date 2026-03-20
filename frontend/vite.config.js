import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
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
