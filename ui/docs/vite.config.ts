import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import path from "path";

export default defineConfig({
  plugins: [
    mdx(),
    react({ include: /\.(jsx|tsx|mdx)$/ }),
  ],
  resolve: {
    alias: {
      "@/": path.resolve(__dirname, "../goose2/src") + "/",
      "~/": path.resolve(__dirname, "src") + "/",
    },
  },
  server: {
    port: 3333,
  },
});
