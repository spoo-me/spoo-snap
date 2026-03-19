import { useMutation } from "@tanstack/react-query";
import { classicQrUrl, gradientQrUrl } from "@/api/qr";
import { shortenUrl } from "@/api/shorten";
import type { CreateUrlRequest, UrlResponse } from "@/api/types";
import { HISTORY_MAX_ITEMS } from "@/lib/constants";
import { historyStorage, settingsStorage } from "@/lib/storage";

export function useShortenMutation() {
  return useMutation<UrlResponse, Error, CreateUrlRequest>({
    mutationFn: shortenUrl,
    onSuccess: async (data) => {
      // Save to persistent history
      const settings = await settingsStorage.getValue();

      let qrUrl: string | null = null;
      if (settings.qr.enabled) {
        const qrText = settings.qr.useOriginalUrl ? data.long_url : data.short_url;
        if (settings.qr.style === "gradient") {
          qrUrl = gradientQrUrl({
            content: qrText,
            start: settings.qr.gradient.start,
            end: settings.qr.gradient.end,
            background: settings.qr.gradient.background,
            direction: settings.qr.gradient.direction,
            style: settings.qr.moduleStyle,
            size: settings.qr.size ?? undefined,
          });
        } else {
          qrUrl = classicQrUrl({
            content: qrText,
            color: settings.qr.classic.color,
            background: settings.qr.classic.background,
            style: settings.qr.moduleStyle,
            size: settings.qr.size ?? undefined,
          });
        }
      }

      const history = await historyStorage.getValue();
      const updated = [
        {
          originalUrl: data.long_url,
          shortUrl: data.short_url,
          alias: data.alias,
          qrUrl,
          timestamp: Date.now(),
        },
        ...history,
      ].slice(0, HISTORY_MAX_ITEMS);

      await historyStorage.setValue(updated);
    },
  });
}
