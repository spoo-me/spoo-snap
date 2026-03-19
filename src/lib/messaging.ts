export type MessageType =
  | "process-url"
  | "shorten-url"
  | "show-notification"
  | "auth-changed"
  | "get-auth-state";

export interface ProcessUrlMessage {
  type: "process-url";
  url: string;
  originalText: string;
}

export interface ShortenUrlMessage {
  type: "shorten-url";
  url: string;
  alias?: string;
}

export interface ShowNotificationMessage {
  type: "show-notification";
  shortUrl: string;
  qrUrl: string | null;
  duration: number;
}

export interface AuthChangedMessage {
  type: "auth-changed";
  mode: "jwt" | "apikey" | "anonymous";
}

export interface GetAuthStateMessage {
  type: "get-auth-state";
}

export type ExtensionMessage =
  | ProcessUrlMessage
  | ShortenUrlMessage
  | ShowNotificationMessage
  | AuthChangedMessage
  | GetAuthStateMessage;

/**
 * Send a typed message to the background service worker.
 */
/**
 * Send a typed message to the background service worker.
 */
export function sendMessage<T = unknown>(message: ExtensionMessage): Promise<T> {
  return browser.runtime.sendMessage(message) as Promise<T>;
}
