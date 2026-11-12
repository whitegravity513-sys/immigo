import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/,
              priority: 30,
            },
            {
              name: "vendor-icons",
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-excel",
              test: /[\\/]node_modules[\\/]xlsx[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-pdf",
              test: /[\\/]node_modules[\\/](html2pdf\.js|jspdf|html2canvas)[\\/]/,
              priority: 20,
            },
            {
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
});