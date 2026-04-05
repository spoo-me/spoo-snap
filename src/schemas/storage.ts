import { z } from "zod/v4";

/**
 * Schema for the old v1 storage format.
 * Used to safely parse and migrate data from the old extension.
 */
export const oldSettingsSchema = z.object({
  enableQr: z.boolean().optional(),
  useOriginalUrl: z.boolean().optional(),
  qrStyle: z.string().optional(),
  qrColor: z.string().optional(),
  qrBackground: z.string().optional(),
  qrGradient1: z.string().optional(),
  qrGradient2: z.string().optional(),
  notificationDuration: z.number().optional(),
  autoCopy: z.boolean().optional(),
  theme: z.string().optional(),
  stealthMode: z.boolean().optional(),
});

export type OldSettings = z.infer<typeof oldSettingsSchema>;

export const oldHistoryItemSchema = z.object({
  originalUrl: z.string(),
  shortUrl: z.string(),
  qrUrl: z.string().optional().nullable(),
  timestamp: z.number(),
});

export type OldHistoryItem = z.infer<typeof oldHistoryItemSchema>;

export const oldHistorySchema = z.array(oldHistoryItemSchema);
