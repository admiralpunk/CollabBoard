import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";

export default defineConfig({
  base: "/", // Correct base for production deployment
  plugins: [react()],
  resolve: {
    alias: {
      // Proper aliasing for buffer and process
      buffer: "buffer",
      process: "process/browser",
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "socket.io-client",
      "styled-components",
      "simple-peer",
      "buffer",
      "process",
      "util",
      "events",
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
  server: {
    open: true, // Open the browser on server start
  },
});
