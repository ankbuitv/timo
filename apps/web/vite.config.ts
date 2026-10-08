import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Chỉ các biến có tiền tố VITE_ mới được đưa vào bundle. KHÔNG đặt khóa bí mật ở đây.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiProxyTarget = process.env.TIMO_API_PROXY ?? "http://localhost:8787";
  void env;
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      allowedHosts: true,
      // Trình duyệt chỉ gọi đường dẫn tương đối /api; dev server chuyển tiếp sang Worker cục bộ.
      proxy: {
        "/api": { target: apiProxyTarget, changeOrigin: false },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
      allowedHosts: true,
      proxy: {
        "/api": { target: apiProxyTarget, changeOrigin: false },
      },
    },
    build: {
      target: "es2022",
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/@supabase")) return "supabase";
            if (id.includes("node_modules/@tanstack")) return "query";
            if (id.includes("node_modules/react-router")) return "router";
            if (id.includes("node_modules/react") || id.includes("node_modules/scheduler"))
              return "react";
            return undefined;
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["./src/test/setup.ts"],
      css: false,
    },
  };
});
