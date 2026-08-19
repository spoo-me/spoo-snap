// ── Auth ─────────────────────────────────────────────────────

// The SDK's profile shape (from /auth/me and the device-token exchange).
export type { UserProfile } from "spoo.me";

export type AuthMode = "jwt" | "apikey" | "anonymous";

// ── QR ───────────────────────────────────────────────────────
// qr.spoo.me is a separate service and stays outside the SDK's scope.

export type ModuleStyle =
  | "rounded"
  | "square"
  | "circle"
  | "gapped"
  | "horizontal_bars"
  | "vertical_bars";

export type GradientDirection = "vertical" | "horizontal" | "radial" | "square";

export type QrOutputFormat = "png" | "svg";

export interface ClassicQrParams {
  content: string;
  color?: string;
  background?: string;
  size?: number;
  style?: ModuleStyle;
  output?: QrOutputFormat;
}

export interface GradientQrParams {
  content: string;
  start?: string;
  end?: string;
  background?: string;
  size?: number;
  style?: ModuleStyle;
  direction?: GradientDirection;
  output?: QrOutputFormat;
}
