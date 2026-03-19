export const API_BASE_URL = "https://spoo.me";
export const QR_API_BASE_URL = "https://qr.spoo.me";

export const API_V1 = `${API_BASE_URL}/api/v1`;
export const QR_API_V1 = `${QR_API_BASE_URL}/api/v1`;

export const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  refresh: `${API_BASE_URL}/auth/refresh`,
  logout: `${API_BASE_URL}/auth/logout`,
  me: `${API_BASE_URL}/auth/me`,
  setPassword: `${API_BASE_URL}/auth/set-password`,
  sendVerification: `${API_BASE_URL}/auth/send-verification`,
  verifyEmail: `${API_BASE_URL}/auth/verify-email`,
  requestPasswordReset: `${API_BASE_URL}/auth/request-password-reset`,
  resetPassword: `${API_BASE_URL}/auth/reset-password`,
} as const;

export const OAUTH_ENDPOINTS = {
  google: `${API_BASE_URL}/oauth/google`,
  github: `${API_BASE_URL}/oauth/github`,
  discord: `${API_BASE_URL}/oauth/discord`,
} as const;

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
  autoShortenOnCopy: false,
  theme: "system" as const,
} as const;

export const HISTORY_MAX_ITEMS = 100;

export const ACCESS_TOKEN_TTL_MS = 900 * 1000; // 15 minutes
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry
