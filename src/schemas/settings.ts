import { z } from "zod/v4";

export const moduleStyleSchema = z.enum([
  "rounded",
  "square",
  "circle",
  "gapped",
  "horizontal_bars",
  "vertical_bars",
]);

export const gradientDirectionSchema = z.enum(["vertical", "horizontal", "radial", "square"]);

export const extensionSettingsSchema = z.object({
  qr: z.object({
    enabled: z.boolean(),
    useOriginalUrl: z.boolean(),
    style: z.enum(["classic", "gradient"]),
    classic: z.object({
      color: z.string(),
      background: z.string(),
    }),
    gradient: z.object({
      start: z.string(),
      end: z.string(),
      background: z.string(),
      direction: gradientDirectionSchema,
    }),
    moduleStyle: moduleStyleSchema,
    size: z.number().nullable(),
  }),
  notification: z.object({
    duration: z.number().min(1).max(60),
    stealthMode: z.boolean(),
  }),
  autoCopy: z.boolean(),
  autoShortenOnCopy: z.boolean(),
  theme: z.enum(["light", "dark", "system"]),
});

export type ExtensionSettings = z.infer<typeof extensionSettingsSchema>;

export const historyItemSchema = z.object({
  originalUrl: z.string(),
  shortUrl: z.string(),
  alias: z.string(),
  qrUrl: z.string().nullable(),
  timestamp: z.number(),
});

export type HistoryItem = z.infer<typeof historyItemSchema>;
