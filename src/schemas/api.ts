import { z } from "zod/v4";

// ── Auth ─────────────────────────────────────────────────────

export const authProviderInfoSchema = z.object({
  provider: z.string().nullable(),
  email: z.string().nullable(),
  linked_at: z.string().nullable(),
});

export const userPfpSchema = z.object({
  url: z.string().nullable(),
  source: z.string().nullable(),
});

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  email_verified: z.boolean(),
  user_name: z.string().nullable(),
  plan: z.string(),
  password_set: z.boolean(),
  auth_providers: z.array(authProviderInfoSchema),
  pfp: userPfpSchema.nullable().optional(),
});

export const loginResponseSchema = z.object({
  access_token: z.string(),
  user: userProfileSchema,
});

export const registerResponseSchema = z.object({
  access_token: z.string(),
  user: userProfileSchema,
  requires_verification: z.boolean(),
  verification_sent: z.boolean(),
});

export const refreshResponseSchema = z.object({
  access_token: z.string(),
});

export const meResponseSchema = z.object({
  user: userProfileSchema,
});

export const messageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const verifyEmailResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  email_verified: z.boolean(),
});

export const sendVerificationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  expires_in: z.number(),
});

// ── URLs ─────────────────────────────────────────────────────

export const urlResponseSchema = z.object({
  alias: z.string(),
  short_url: z.string(),
  long_url: z.string(),
  owner_id: z.string().nullable(),
  created_at: z.number(),
  status: z.string(),
  private_stats: z.boolean().nullable(),
});

export const updateUrlResponseSchema = z.object({
  id: z.string(),
  alias: z.string().nullable(),
  long_url: z.string().nullable(),
  status: z.string().nullable(),
  password_set: z.boolean(),
  max_clicks: z.number().nullable(),
  expire_after: z.number().nullable(),
  block_bots: z.boolean().nullable(),
  private_stats: z.boolean().nullable(),
  updated_at: z.number(),
});

export const urlListItemSchema = z.object({
  id: z.string(),
  alias: z.string().nullable(),
  long_url: z.string().nullable(),
  status: z.string().nullable(),
  created_at: z.string().nullable(),
  expire_after: z.number().nullable(),
  max_clicks: z.number().nullable(),
  private_stats: z.boolean().nullable(),
  block_bots: z.boolean().nullable(),
  password_set: z.boolean(),
  total_clicks: z.number().nullable(),
  last_click: z.string().nullable(),
});

export const urlListResponseSchema = z.object({
  items: z.array(urlListItemSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  hasNext: z.boolean(),
  sortBy: z.string(),
  sortOrder: z.string(),
});

export const deleteUrlResponseSchema = z.object({
  message: z.string(),
  id: z.string(),
});

// ── Stats ────────────────────────────────────────────────────

export const statsSummarySchema = z.object({
  total_clicks: z.number(),
  unique_clicks: z.number(),
  first_click: z.string().nullable(),
  last_click: z.string().nullable(),
  avg_redirection_time: z.number(),
});

export const statsTimeRangeSchema = z.object({
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
});

export const computedMetricsSchema = z.object({
  unique_click_rate: z.number(),
  repeat_click_rate: z.number(),
  average_clicks_per_visitor: z.number(),
});

export const timeBucketInfoSchema = z.object({
  strategy: z.string(),
  mongo_format: z.string(),
  display_format: z.string(),
  timezone: z.string(),
  interval_minutes: z.number().nullable(),
});

export const statsResponseSchema = z.object({
  scope: z.string(),
  filters: z.record(z.string(), z.unknown()),
  group_by: z.array(z.string()),
  timezone: z.string(),
  time_range: statsTimeRangeSchema,
  summary: statsSummarySchema,
  metrics: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
  generated_at: z.string().nullable().optional(),
  api_version: z.string().nullable().optional(),
  short_code: z.string().nullable().optional(),
  time_bucket_info: timeBucketInfoSchema.nullable().optional(),
  computed_metrics: computedMetricsSchema.nullable().optional(),
});

// ── API Keys ─────────────────────────────────────────────────

export const apiKeyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  scopes: z.array(z.string()),
  created_at: z.number().nullable(),
  expires_at: z.number().nullable(),
  revoked: z.boolean(),
  token_prefix: z.string().nullable(),
});

export const apiKeyCreatedResponseSchema = apiKeyResponseSchema.extend({
  token: z.string(),
});

export const apiKeysListResponseSchema = z.object({
  keys: z.array(apiKeyResponseSchema),
});

export const apiKeyActionResponseSchema = z.object({
  success: z.boolean(),
  action: z.string(),
});

// ── Errors ───────────────────────────────────────────────────

export const apiErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  field: z.string().optional(),
  details: z.unknown().optional(),
});
