// ── Auth ─────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  user_name?: string | null;
}

export interface SetPasswordRequest {
  password: string;
}

export interface VerifyEmailRequest {
  code: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
}

export interface AuthProviderInfo {
  provider: string | null;
  email: string | null;
  linked_at: string | null;
}

export interface UserPfp {
  url: string | null;
  source: string | null;
}

export interface UserProfile {
  id: string;
  email: string | null;
  email_verified: boolean;
  user_name: string | null;
  plan: string;
  password_set: boolean;
  auth_providers: AuthProviderInfo[];
  pfp?: UserPfp | null;
}

export interface LoginResponse {
  access_token: string;
  user: UserProfile;
}

export interface RegisterResponse {
  access_token: string;
  user: UserProfile;
  requires_verification: boolean;
  verification_sent: boolean;
}

export interface RefreshResponse {
  access_token: string;
}

export interface LogoutResponse {
  success: boolean;
}

export interface MeResponse {
  user: UserProfile;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  email_verified: boolean;
}

export interface SendVerificationResponse {
  success: boolean;
  message: string;
  expires_in: number;
}

export interface MessageResponse {
  success: boolean;
  message?: string;
}

// ── URL Shortening ───────────────────────────────────────────

export interface CreateUrlRequest {
  long_url: string;
  alias?: string;
  password?: string;
  block_bots?: boolean;
  max_clicks?: number;
  expire_after?: string | number;
  private_stats?: boolean;
}

export interface UrlResponse {
  alias: string;
  short_url: string;
  long_url: string;
  owner_id: string | null;
  created_at: number;
  status: string;
  private_stats: boolean | null;
}

// ── URL Management ───────────────────────────────────────────

export interface UpdateUrlRequest {
  long_url?: string;
  alias?: string;
  password?: string;
  block_bots?: boolean;
  max_clicks?: number | null;
  expire_after?: string | number | null;
  private_stats?: boolean;
  status?: "ACTIVE" | "INACTIVE";
}

export interface UpdateUrlStatusRequest {
  status: "ACTIVE" | "INACTIVE";
}

export interface UpdateUrlResponse {
  id: string;
  alias: string | null;
  long_url: string | null;
  status: string | null;
  password_set: boolean;
  max_clicks: number | null;
  expire_after: number | null;
  block_bots: boolean | null;
  private_stats: boolean | null;
  updated_at: number;
}

export interface UrlListItem {
  id: string;
  alias: string | null;
  long_url: string | null;
  status: string | null;
  created_at: string | null;
  expire_after: number | null;
  max_clicks: number | null;
  private_stats: boolean | null;
  block_bots: boolean | null;
  password_set: boolean;
  total_clicks: number | null;
  last_click: string | null;
}

export interface UrlListResponse {
  items: UrlListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  sortBy: string;
  sortOrder: string;
}

export interface DeleteUrlResponse {
  message: string;
  id: string;
}

export interface ListUrlsQuery {
  page?: number;
  page_size?: number;
  sort_by?: "created_at" | "last_click" | "total_clicks";
  sort_order?: "ascending" | "descending";
  filter?: string;
}

// ── Stats ────────────────────────────────────────────────────

export interface StatsQuery {
  scope?: "all" | "anon";
  short_code?: string;
  start_date?: string;
  end_date?: string;
  group_by?: string;
  metrics?: string;
  timezone?: string;
  filters?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  referrer?: string;
}

export interface ExportQuery extends StatsQuery {
  format: "csv" | "xlsx" | "json" | "xml";
}

export interface StatsSummary {
  total_clicks: number;
  unique_clicks: number;
  first_click: string | null;
  last_click: string | null;
  avg_redirection_time: number;
}

export interface StatsTimeRange {
  start_date: string | null;
  end_date: string | null;
}

export interface ComputedMetrics {
  unique_click_rate: number;
  repeat_click_rate: number;
  average_clicks_per_visitor: number;
}

export interface TimeBucketInfo {
  strategy: string;
  mongo_format: string;
  display_format: string;
  timezone: string;
  interval_minutes: number | null;
}

export interface StatsResponse {
  scope: string;
  filters: Record<string, unknown>;
  group_by: string[];
  timezone: string;
  time_range: StatsTimeRange;
  summary: StatsSummary;
  metrics: Record<string, Record<string, unknown>[]>;
  generated_at?: string;
  api_version?: string;
  short_code?: string;
  time_bucket_info?: TimeBucketInfo;
  computed_metrics?: ComputedMetrics;
}

// ── API Keys ─────────────────────────────────────────────────

export type ApiKeyScope =
  | "shorten:create"
  | "urls:manage"
  | "urls:read"
  | "stats:read"
  | "admin:all";

export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  scopes: ApiKeyScope[];
  expires_at?: string | number;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  description: string | null;
  scopes: string[];
  created_at: number | null;
  expires_at: number | null;
  revoked: boolean;
  token_prefix: string | null;
}

export interface ApiKeyCreatedResponse extends ApiKeyResponse {
  token: string;
}

export interface ApiKeysListResponse {
  keys: ApiKeyResponse[];
}

export interface ApiKeyActionResponse {
  success: boolean;
  action: string;
}

// ── QR ───────────────────────────────────────────────────────

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

export interface BatchQrItem {
  content: string;
  color?: string;
  background?: string;
  size?: number;
  style?: ModuleStyle;
  output?: QrOutputFormat;
  filename?: string;
}

// ── Errors ───────────────────────────────────────────────────

export interface ApiErrorResponse {
  error: string;
  code: string;
  field?: string;
  details?: unknown;
}

// ── Auth Mode ────────────────────────────────────────────────

export type AuthMode = "jwt" | "apikey" | "anonymous";
