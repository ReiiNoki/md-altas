import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { BASE_PATH } from "./site.config.js";

export default defineConfig({
  base: BASE_PATH,
  // Windows can expose the same file under c:/ and C:/. Use the filesystem's
  // canonical root so Vite does not create duplicate React context modules.
  root: realpathSync.native(fileURLToPath(new URL(".", import.meta.url))),
  plugins: [react()],
  server: {
    strictPort: false,
  },
});
