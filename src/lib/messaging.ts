export interface ShortenUrlMessage {
  type: "shorten-url";
  url: string;
  alias?: string;
}

export interface GetAuthStateMessage {
  type: "get-auth-state";
}

export interface DeviceAuthCodeMessage {
  type: "device-auth-code";
  code: string;
}

/**
 * Ask the background service worker to refresh the JWT session now.
 * The background is the only context that ever refreshes tokens; UI
 * contexts send this on a 401 and retry once. Responds {refreshed}.
 */
export interface RefreshTokenMessage {
  type: "refresh-token";
}

export type ExtensionMessage =
  | ShortenUrlMessage
  | GetAuthStateMessage
  | DeviceAuthCodeMessage
  | RefreshTokenMessage;

/**
 * Send a typed message to the background service worker.
 */
export function sendMessage<T = unknown>(message: ExtensionMessage): Promise<T> {
  return browser.runtime.sendMessage(message) as Promise<T>;
}
