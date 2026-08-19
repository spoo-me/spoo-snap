export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://spoo.me";
export const QR_API_BASE_URL = import.meta.env.VITE_QR_API_BASE_URL || "https://qr.spoo.me";

export const QR_API_V1 = `${QR_API_BASE_URL}/api/v1`;

export const DEFAULT_SETTINGS = {
  qr: {
    enabled: true,
    useOriginalUrl: false,
    style: "classic" as const,
    classic: { color: "black", background: "white" },
    gradient: {
      start: "#6a1a4c",
      end: "#40353c",
      background: "#ffffff",
      direction: "vertical" as const,
    },
    moduleStyle: "rounded" as const,
    size: null as number | null,
  },
  notification: {
    duration: 30,
    stealthMode: false,
  },
  autoCopy: true,
  theme: "system" as const,
} as const;

export const HISTORY_MAX_ITEMS = 100;

/** Branded QR gradient matching the spoo.me dashboard */
export const QR_BRAND = { start: "#1d1919", end: "#322c29", size: 300 } as const;
