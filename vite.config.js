import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the built app also works when served from any path
  // (e.g. Firebase Hosting, GitHub Pages, or a plain static server).
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
