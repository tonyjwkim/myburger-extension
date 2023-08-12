import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import copyAssets from "rollup-plugin-copy-assets";

export default defineConfig({
  plugins: [
    react(),
    copyAssets({
      assets: ["./icons", "./manifest.json"],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: "index.html",
      },
      output: {
        assetFileNames: `assets/[name].[ext]`,
        chunkFileNames: `[name].js`,
        entryFileNames: `[name].js`,
      },
    },
    outDir: "dist",
    assetsDir: ".",
    sourcemap: true,
    emptyOutDir: true,
  },
  server: {
    cors: true,
  },
});
