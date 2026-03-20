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
    name: "spoo.me - Shorten, Share & Track",
    description: "Shorten URLs, generate QR codes, manage links, and track analytics with spoo.me",
    permissions: [
      "storage",
      "notifications",
      "scripting",
      "activeTab",
      "tabs",
      "contextMenus",
      "sidePanel",
      "alarms",
    ],
    host_permissions: ["https://spoo.me/*", "https://qr.spoo.me/*"],
    web_accessible_resources: [
      {
        resources: ["icon/*"],
        matches: ["<all_urls>"],
      },
    ],
    commands: {
      "shorten-current": {
        suggested_key: { default: "Alt+Shift+S", mac: "MacCtrl+Shift+S" },
        description: "Shorten the current page URL",
      },
    },
    omnibox: { keyword: "spoo" },
  },
  webExt: {
    startUrls: ["https://example.com"],
  },
});
