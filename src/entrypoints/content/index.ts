import type { ShowNotificationMessage } from "@/lib/messaging";

export default defineContentScript({
  matches: ["https://spoo.me/*"],
  main() {
    // Listen for notification messages from background
    browser.runtime.onMessage.addListener(
      (message: ShowNotificationMessage, _sender, sendResponse) => {
        if (message.type === "show-notification") {
          showNotification(message.shortUrl, message.qrUrl, message.duration);
          sendResponse({ received: true });
        }
        return false;
      },
    );
  },
});

// ── Shadow DOM Notification ──────────────────────────────────

let currentNotification: HTMLElement | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

function showNotification(shortUrl: string, qrUrl: string | null, duration: number): void {
  removeNotification();

  const host = document.createElement("div");
  host.id = "spoo-notification-host";
  const shadow = host.attachShadow({ mode: "closed" });

  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        bottom: 16px;
        right: 16px;
        z-index: 2147483647;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .toast {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        padding: 12px 16px;
        max-width: 320px;
        animation: slideIn 0.2s ease-out;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      @media (prefers-color-scheme: dark) {
        .toast {
          background: #1f2937;
          border-color: #374151;
          color: #f9fafb;
        }
        .url { color: #93c5fd !important; }
        .close:hover { background: #374151 !important; }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .title {
        font-size: 13px;
        font-weight: 600;
        color: #111827;
      }
      @media (prefers-color-scheme: dark) {
        .title { color: #f9fafb; }
      }
      .close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 14px;
        color: #6b7280;
        line-height: 1;
      }
      .close:hover { background: #f3f4f6; }
      .url-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .url {
        font-size: 13px;
        color: #2563eb;
        text-decoration: none;
        font-weight: 500;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .copy-btn {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
        background: #f9fafb;
        cursor: pointer;
        color: #374151;
        font-weight: 500;
        white-space: nowrap;
      }
      .copy-btn:hover { background: #f3f4f6; }
      @media (prefers-color-scheme: dark) {
        .copy-btn {
          background: #374151;
          border-color: #4b5563;
          color: #e5e7eb;
        }
        .copy-btn:hover { background: #4b5563; }
      }
      .qr {
        width: 80px;
        height: 80px;
        border-radius: 6px;
        align-self: center;
      }
    </style>
    <div class="toast">
      <div class="header">
        <span class="title">URL Shortened!</span>
        <button class="close" aria-label="Close">\u00d7</button>
      </div>
      <div class="url-row">
        <a class="url" href="${shortUrl}" target="_blank" rel="noopener">${shortUrl}</a>
        <button class="copy-btn">Copy</button>
      </div>
      ${qrUrl ? `<img class="qr" src="${qrUrl}" alt="QR Code" />` : ""}
    </div>
  `;

  // Event handlers
  const closeBtn = shadow.querySelector(".close");
  closeBtn?.addEventListener("click", removeNotification);

  const copyBtn = shadow.querySelector(".copy-btn");
  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      if (copyBtn) copyBtn.textContent = "Copied!";
      setTimeout(() => {
        if (copyBtn) copyBtn.textContent = "Copy";
      }, 2000);
    } catch {
      // Clipboard API might not be available
    }
  });

  document.body.appendChild(host);
  currentNotification = host;

  // Auto-hide
  hideTimeout = setTimeout(removeNotification, duration * 1000);
}

function removeNotification(): void {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  if (currentNotification) {
    currentNotification.remove();
    currentNotification = null;
  }
}
