import { resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// SHOWCASE_BASE rewrites asset URLs for hosting under a subpath, e.g.
// SHOWCASE_BASE=/signal-design/ for the GitHub Pages deploy. Local builds
// default to "/".
export default defineConfig({
  base: process.env.SHOWCASE_BASE || "/",
  plugins: [tailwindcss()],
  server: { port: 5178, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        components: resolve(import.meta.dirname, "index.html"),
        shell: resolve(import.meta.dirname, "shell.html"),
        chat: resolve(import.meta.dirname, "chat.html"),
        form: resolve(import.meta.dirname, "form.html"),
        landing: resolve(import.meta.dirname, "landing.html"),
        charts: resolve(import.meta.dirname, "charts.html"),
      },
    },
  },
});
