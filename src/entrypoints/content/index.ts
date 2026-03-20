export default defineContentScript({
  matches: ["https://spoo.me/*"],
  runAt: "document_idle",
  main() {
    // Reserved for OAuth flow completion on spoo.me
  },
});
