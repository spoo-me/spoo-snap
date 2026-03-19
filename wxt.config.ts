import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  dev: {
    server: { port: 3737 },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "spoo.me - URL Shortener",
    description: "Shorten URLs, generate QR codes, and manage links with spoo.me",
    permissions: [
      "clipboardWrite",
      "storage",
      "notifications",
      "scripting",
      "activeTab",
      "tabs",
      "contextMenus",
      "sidePanel",
    ],
    host_permissions: ["https://spoo.me/*", "https://qr.spoo.me/*"],
    commands: {
      "shorten-current": {
        suggested_key: { default: "Alt+Shift+S" },
        description: "Shorten the current page URL",
      },
    },
    omnibox: { keyword: "spoo" },
  },
  webExt: {
    startUrls: ["https://example.com"],
  },
});
