import { resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { layoutPlugin } from "./layout-plugin.js";
import { ALL, keyOf } from "./pages.js";

// SHOWCASE_BASE rewrites asset URLs for hosting under a subpath, e.g.
// SHOWCASE_BASE=/signal-design/ for the GitHub Pages deploy. Local builds
// default to "/".
export default defineConfig({
  base: process.env.SHOWCASE_BASE || "/",
  plugins: [layoutPlugin(), tailwindcss()],
  server: { port: 5178, strictPort: true },
  build: {
    rollupOptions: {
      input: Object.fromEntries(ALL.map((p) => [keyOf(p), resolve(import.meta.dirname, p.file)])),
    },
  },
});
