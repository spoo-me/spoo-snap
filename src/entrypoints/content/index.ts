import { deviceAuthStateStorage } from "@/lib/storage";

export default defineContentScript({
  matches: [
    "https://spoo.me/*",
    ...(import.meta.env.DEV ? ["http://127.0.0.1/*", "http://localhost/*"] : []),
  ],
  runAt: "document_idle",
  async main() {
    if (!window.location.pathname.startsWith("/auth/device/callback")) return;

    const el = document.getElementById("spoo-ext-auth");
    if (!el) return;

    const code = el.dataset.code;
    if (!code) return;

    // Verify CSRF state matches what the extension generated
    const pageState = el.dataset.state;
    const storedState = await deviceAuthStateStorage.getValue();

    if (!pageState || !storedState || pageState !== storedState) {
      await deviceAuthStateStorage.setValue(null);
      return;
    }

    // Exchange the code — only clear state on success so user can retry on failure
    const response = await browser.runtime.sendMessage({ type: "device-auth-code", code });
    if (response?.success) {
      await deviceAuthStateStorage.setValue(null);
    }
  },
});
