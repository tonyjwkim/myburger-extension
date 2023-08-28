import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import copyAssets from "rollup-plugin-copy-assets";

export default defineConfig({
  plugins: [
    react(),
    copyAssets({
      assets: [
        "./icons",
        "./manifest.json",
        "./background.js",
        "./content.js",
        "./highlight-menu.css",
        "./focus-mode.css",
        "./toast.css",
        "./rules.json",
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: "index.html",
      },
      output: {
        entryFileNames: `[name].js`,
      },
    },
    outDir: "dist",
  },
  server: {
    cors: true,
    port: 3002,
  },
});
