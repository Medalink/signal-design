import { resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: { port: 5178, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        components: resolve(import.meta.dirname, "index.html"),
        shell: resolve(import.meta.dirname, "shell.html"),
        chat: resolve(import.meta.dirname, "chat.html"),
        form: resolve(import.meta.dirname, "form.html"),
      },
    },
  },
});
