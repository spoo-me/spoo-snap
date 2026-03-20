/**
 * Toast notification injected into pages via scripting.executeScript.
 *
 * showToastNotification() is called from the background service worker.
 * injectToastNotification() is the self-contained function that runs in the
 * page's isolated world — it must NOT reference any outer scope.
 */

/**
 * Inject a toast notification into the given tab. Falls back to a basic
 * browser notification if the tab is not scriptable (e.g. chrome:// pages).
 */
export async function showToastNotification(
  tabId: number,
  shortUrl: string,
  qrUrl: string | null,
  duration: number,
  theme: "light" | "dark" | "system",
): Promise<void> {
  // Only inject into http/https pages — chrome://, edge://, about: etc. silently swallow injections
  let canInject = false;
  try {
    const tab = await browser.tabs.get(tabId);
    const url = tab.url ?? "";
    canInject = url.startsWith("http://") || url.startsWith("https://");
  } catch {
    // Tab doesn't exist
  }

  if (canInject) {
    const logoLightUrl = browser.runtime.getURL("/icon/logo-black.png");
    const logoDarkUrl = browser.runtime.getURL("/icon/favicon.png");
    try {
      await browser.scripting.executeScript({
        target: { tabId },
        func: injectToastNotification,
        args: [shortUrl, qrUrl, duration, logoLightUrl, logoDarkUrl, theme],
      });
      return;
    } catch {
      // Injection failed — fall through to browser notification
    }
  }

  await browser.notifications.create(`spoo-${Date.now()}`, {
    type: "basic",
    iconUrl: browser.runtime.getURL("/icon/128.png"),
    title: "URL Shortened!",
    message: shortUrl,
  });
}

/**
 * Self-contained function injected into the page via scripting.executeScript.
 * Must not reference any outer scope — everything is passed via args.
 */
function injectToastNotification(
  shortUrl: string,
  qrUrl: string | null,
  duration: number,
  logoLightUrl: string,
  logoDarkUrl: string,
  theme: "light" | "dark" | "system",
): void {
  // Remove any existing spoo notification
  const existing = document.getElementById("spoo-notification-host");
  if (existing) existing.remove();

  // Resolve effective theme
  let isDark = false;
  if (theme === "dark") {
    isDark = true;
  } else if (theme === "system") {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  const logoUrl = isDark ? logoDarkUrl : logoLightUrl;

  const host = document.createElement("div");
  host.id = "spoo-notification-host";
  const shadow = host.attachShadow({ mode: "open" });

  // Theme is resolved once at injection time via a class on the wrapper,
  // so the toast always matches the extension's theme setting.
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      }

      .toast {
        background: #ffffff;
        border: 1px solid #e4e4e7;
        border-radius: 12px;
        box-shadow:
          0 1px 2px rgba(0, 0, 0, 0.06),
          0 8px 24px rgba(0, 0, 0, 0.1),
          0 20px 48px rgba(0, 0, 0, 0.12);
        width: 280px;
        overflow: hidden;
        color: #09090b;
        animation: spoo-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .toast.hiding {
        animation: spoo-out 0.2s ease forwards;
      }

      .dark .toast {
        background: #0a0a0b;
        border-color: #1e1e22;
        color: #fafafa;
        box-shadow:
          0 1px 2px rgba(0, 0, 0, 0.4),
          0 8px 24px rgba(0, 0, 0, 0.5),
          0 20px 48px rgba(0, 0, 0, 0.6);
      }

      @keyframes spoo-in {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes spoo-out {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(6px) scale(0.98); }
      }

      .body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        margin-bottom: 4px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .logo {
        width: 16px;
        height: 16px;
        object-fit: contain;
      }
      .title {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .close {
        all: unset;
        cursor: pointer;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        color: #a1a1aa;
        opacity: 0;
        transition: opacity 0.15s, background 0.15s, color 0.15s;
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
      }
      .close svg {
        width: 14px;
        height: 14px;
      }
      .toast:hover .close { opacity: 1; }
      .close:hover { background: #f4f4f5; color: #71717a; }
      .dark .close:hover { background: #27272a; color: #a1a1aa; }

      .url-row {
        display: flex;
        align-items: center;
        padding: 0 0 0 10px;
        border-radius: 8px;
        background: #f4f4f5;
        color: #09090b;
      }
      .dark .url-row { background: #18181b; color: #fafafa; }
      .url {
        font-size: 12px;
        font-weight: 500;
        color: #a1a1aa;
        text-decoration: none;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
      }
      .url:hover { color: #d4d4d8; }

      .copy-btn {
        all: unset;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        border-left: 1px solid #e4e4e7;
        border-radius: 0 8px 8px 0;
        color: #a1a1aa;
        transition: color 0.15s, background 0.15s;
      }
      .dark .copy-btn { border-left-color: #27272a; color: #71717a; }
      .copy-btn:hover { background: rgba(0, 0, 0, 0.04); color: #52525b; }
      .dark .copy-btn:hover { background: #27272a; color: #a1a1aa; }
      .copy-btn:active { transform: scale(0.95); }
      .copy-btn.copied { color: #22c55e; }
      .copy-btn svg { width: 14px; height: 14px; }

      .qr-wrap {
        display: flex;
        justify-content: center;
        padding: 4px 0 2px;
      }
      .qr-container {
        background: #ffffff;
        border-radius: 12px;
        padding: 5px;
        border: 1px solid #e4e4e7;
      }
      .dark .qr-container {
        background: #ffffff;
        border-color: #27272a;
      }
      .qr-skeleton {
        width: 100px;
        height: 100px;
        border-radius: 6px;
        background: #f4f4f5;
        animation: spoo-pulse 1.5s ease-in-out infinite;
      }
      .dark .qr-skeleton { background: #e4e4e7; }
      @keyframes spoo-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .qr {
        width: 100px;
        height: 100px;
        border-radius: 6px;
        display: block;
      }

      .progress {
        height: 3px;
        background: #f4f4f5;
      }
      .dark .progress { background: #1a1a1e; }
      .progress-bar {
        height: 100%;
        background: #3f3f46;
        border-radius: 0 0 0 12px;
        animation: spoo-countdown ${duration}s linear forwards;
      }
      @keyframes spoo-countdown {
        from { width: 100%; }
        to { width: 0%; }
      }
    </style>
    <div class="${isDark ? "dark" : "light"}">
      <div class="toast">
        <div class="body">
          <div class="header">
            <div class="brand">
              <img class="logo" src="${logoUrl}" alt="" />
              <span class="title">Link shortened</span>
            </div>
            <button class="close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="url-row">
            <a class="url" href="${shortUrl}" target="_blank" rel="noopener">${shortUrl}</a>
            <button class="copy-btn" aria-label="Copy">
              <svg class="icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:none"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
          ${qrUrl ? `<div class="qr-wrap"><div class="qr-container"><div class="qr-skeleton"></div><img class="qr" src="${qrUrl}" alt="QR" style="display:none" /></div></div>` : ""}
        </div>
        <div class="progress"><div class="progress-bar"></div></div>
      </div>
    </div>
  `;

  // Event handlers
  const dismiss = () => {
    clearTimeout(autoHide);
    const toast = shadow.querySelector(".toast");
    if (toast) {
      toast.classList.add("hiding");
      setTimeout(() => host.remove(), 250);
    } else {
      host.remove();
    }
  };

  shadow.querySelector(".close")?.addEventListener("click", dismiss);

  const copyBtn = shadow.querySelector(".copy-btn");
  const iconCopy = shadow.querySelector<HTMLElement>(".icon-copy");
  const iconCheck = shadow.querySelector<HTMLElement>(".icon-check");
  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      if (iconCopy && iconCheck) {
        iconCopy.style.display = "none";
        iconCheck.style.display = "block";
        copyBtn.classList.add("copied");
        setTimeout(() => {
          iconCopy.style.display = "block";
          iconCheck.style.display = "none";
          copyBtn.classList.remove("copied");
        }, 2000);
      }
    } catch {
      // Clipboard API might not be available
    }
  });

  // QR skeleton → image swap on load
  const qrImg = shadow.querySelector<HTMLImageElement>(".qr");
  const qrSkeleton = shadow.querySelector(".qr-skeleton");
  if (qrImg && qrSkeleton) {
    qrImg.addEventListener("load", () => {
      qrSkeleton.remove();
      qrImg.style.display = "block";
    });
    qrImg.addEventListener("error", () => {
      qrSkeleton.remove();
    });
  }

  document.body.appendChild(host);
  const autoHide = setTimeout(dismiss, duration * 1000);
}
