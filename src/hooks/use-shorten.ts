import { useMutation } from "@tanstack/react-query";
import type { CreatedLink, CreateLinkParams } from "spoo.me";
import { gradientQrUrl } from "@/api/qr";
import { HISTORY_MAX_ITEMS, QR_BRAND } from "@/lib/constants";
import { withSpoo } from "@/lib/spoo";
import { historyStorage, settingsStorage } from "@/lib/storage";

export function useShortenMutation() {
  return useMutation<CreatedLink, Error, CreateLinkParams>({
    mutationFn: (params) => withSpoo((spoo) => spoo.links.create(params)),
    onSuccess: async (data) => {
      const settings = await settingsStorage.getValue();

      let qrUrl: string | null = null;
      if (settings.qr.enabled) {
        const qrText = settings.qr.useOriginalUrl ? data.long_url : data.short_url;
        qrUrl = gradientQrUrl({ content: qrText, ...QR_BRAND });
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
