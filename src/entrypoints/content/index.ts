export default defineContentScript({
  matches: ["https://spoo.me/*"],
  main() {
    console.log("spoo.me content script loaded");
  },
});
