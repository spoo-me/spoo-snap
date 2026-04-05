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

export type ExtensionMessage = ShortenUrlMessage | GetAuthStateMessage | DeviceAuthCodeMessage;

/**
 * Send a typed message to the background service worker.
 */
export function sendMessage<T = unknown>(message: ExtensionMessage): Promise<T> {
  return browser.runtime.sendMessage(message) as Promise<T>;
}
