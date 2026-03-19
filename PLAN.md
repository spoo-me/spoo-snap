# spoo-snap Complete Refactor Plan

## Context

spoo-snap is spoo.me's browser extension (~1,750 lines of vanilla JS). It's broken: the API calls hit old endpoints (`POST https://spoo.me/` instead of `POST /api/v1/shorten`), QR API params are wrong, there's no auth support, duplicated code across files, no build tools, no types, and ugly UI. The spoo.me backend has been significantly refactored with auth (JWT + API keys + OAuth), URL management CRUD, rich analytics, scoped permissions, and new QR API endpoints. The extension needs to catch up and become a proper part of the ecosystem.

---

## Tech Stack

| Tool | Purpose | Ecosystem Equivalent |
|------|---------|---------------------|
| **WXT** (wxt.dev) | Web extension framework (Vite-based, MV3, multi-browser) | Community standard |
| **React 19** | UI framework | Widely known, rich ecosystem |
| **TypeScript 5.7+** | Type safety | Like Pydantic for JS |
| **Tailwind CSS v4** | Styling (CSS-first config, no JS config file) | Modern utility CSS |
| **shadcn/ui** | Component library | Beautiful, accessible, customizable |
| **TanStack Query** | Server state (API calls, caching, refetching) | Handles loading/error/cache automatically |
| **Zustand** | Client state (auth tokens, settings, UI) | Lightweight, simple |
| **Zod** | Runtime schema validation (API responses, forms, storage) | Like Pydantic validators for JS |
| **Bun** | Package manager / runtime | Like `uv` for JS |
| **Biome** | Linting + formatting | Like `ruff` for JS |
| **lucide-react** | Icons | Consistent icon set |

**Bundle size budget**: Target <200KB total gzipped per entrypoint. CI check via `bun run build` output + size-limit or manual threshold in CI script. React 19 + TanStack Query + Zustand + Zod are all tree-shakeable; shared chunks between popup/sidepanel via Vite's code splitting.

---

## Architecture

```
spoo-snap/
├── src/
│   ├── entrypoints/              # WXT auto-discovered entry points
│   │   ├── background/index.ts   # Service worker: API calls, context menu, shortcuts
│   │   ├── popup/                # Compact popup UI (380px)
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.html
│   │   ├── sidepanel/            # Rich full UI (URL mgmt, analytics, settings)
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.html
│   │   └── content/index.ts      # Copy detection + Shadow DOM notification
│   ├── api/                      # Typed API client layer
│   │   ├── client.ts             # Base HTTP client with auth injection + refresh
│   │   ├── types.ts              # All request/response types (mirrors Pydantic DTOs)
│   │   ├── shorten.ts            # POST /api/v1/shorten
│   │   ├── urls.ts               # GET/PATCH/DELETE /api/v1/urls
│   │   ├── stats.ts              # GET /api/v1/stats
│   │   ├── auth.ts               # /auth/* endpoints
│   │   ├── keys.ts               # /api/v1/keys CRUD
│   │   ├── qr.ts                 # qr.spoo.me/api/v1/*
│   │   └── export.ts             # /api/v1/export
│   ├── schemas/                  # Zod schemas for runtime validation
│   │   ├── api.ts                # API response validation schemas
│   │   ├── settings.ts           # Settings schema + defaults
│   │   └── storage.ts            # Storage data validation (incl. migration)
│   ├── stores/                   # Zustand stores (client-only state)
│   │   ├── auth.ts               # Tokens, user profile, auth mode
│   │   ├── settings.ts           # Extension preferences
│   │   └── ui.ts                 # UI state (active tab, modals, etc.)
│   ├── components/               # Shared React components
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── auth/                 # LoginForm, ApiKeyInput, AuthGuard
│   │   ├── url/                  # ShortenForm, UrlCard, UrlList
│   │   ├── stats/                # StatsSummary, StatsChart
│   │   ├── qr/                   # QrPreview, QrSettings
│   │   ├── settings/             # All settings panels
│   │   └── shared/               # ThemeProvider, Layout, Notification
│   ├── hooks/                    # TanStack Query hooks + custom hooks
│   │   ├── use-shorten.ts        # useShortenMutation
│   │   ├── use-urls.ts           # useUrls, useUrl, useUpdateUrl, useDeleteUrl
│   │   ├── use-stats.ts          # useUrlStats, useAggregateStats
│   │   ├── use-auth.ts           # useLogin, useRegister, useLogout, useAuthState
│   │   ├── use-keys.ts           # useApiKeys, useCreateKey, useRevokeKey
│   │   ├── use-settings.ts       # useSettings (reads from Zustand/storage)
│   │   └── use-theme.ts          # useTheme (system/light/dark)
│   ├── lib/                      # Utilities
│   │   ├── url-utils.ts          # Single source of truth (currently duplicated)
│   │   ├── storage.ts            # WXT storage item definitions
│   │   ├── constants.ts          # API URLs, defaults, limits
│   │   ├── errors.ts             # Error types + offline/retry helpers
│   │   ├── messaging.ts          # Type-safe cross-context messaging
│   │   ├── migration.ts          # Old -> new storage migration (independently testable)
│   │   └── query-client.ts       # Shared TanStack Query client factory
│   └── assets/                   # Icons, images
├── public/                       # Static files (extension icons)
├── wxt.config.ts                 # WXT + manifest config
├── src/styles/app.css            # Tailwind v4 CSS-first config (@theme, @import)
├── tsconfig.json
├── biome.json
├── package.json
├── bun.lock
└── components.json               # shadcn/ui config
```

**Note**: No `tailwind.config.ts` — Tailwind v4 uses CSS-first configuration via `@theme` directives in `src/styles/app.css`. No separate options page entrypoint — the side panel serves as the full settings UI (avoids redundant entrypoint that inflates bundle).

---

## Key Design Decisions

### Auth Strategy (Full auth from day one)
- **API key mode**: `spoo_*` key stored in `chrome.storage.local` (persistent).
- **JWT mode**: Access token in `chrome.storage.session` (short-lived, cleared on browser close). Refresh token in `chrome.storage.local` (persistent — browser already isolates per-extension, no extra encryption needed) — enables "remember me" across browser sessions. Access token refreshed via `chrome.alarms` before expiry.
- **OAuth**: Google, GitHub, Discord via `chrome.identity.launchWebAuthFlow` exclusively (extension-native API, secure redirect to `https://<extension-id>.chromiumapp.org/`). No fallback to content script token extraction — that approach is fragile and a security risk. If `launchWebAuthFlow` isn't viable for a provider, that provider is deferred until backend adds proper extension redirect URI support.
- **Anonymous mode**: Fallback with limited features (shorten only, no URL mgmt).
- Priority: API key > JWT > anonymous.

### Storage Schema
- WXT's `storage.defineItem` for typed, reactive storage
- Access token in `session:` scope (short-lived, cleared on browser close)
- Refresh token + API key + settings in `local:` scope (persistent across sessions)
- Migration module at `src/lib/migration.ts` — independently testable, not embedded in service worker. Reads old flat `settings`/`history` keys, validates with Zod, writes to new schema, sets `v2Migrated` flag.

### Content Script & Permissions
- **Shadow DOM** for notification UI (prevents CSS conflicts with host page)
- Content script matches `https://spoo.me/*` only (for OAuth token handling). Copy detection uses `chrome.scripting.executeScript` from background on active tab instead of a blanket all-URLs content script — avoids Chrome Web Store review scrutiny for broad host permissions.
- **Alternative**: If `executeScript` on active tab proves too limited for copy detection, fall back to `activeTab` permission + user-gesture trigger (context menu / keyboard shortcut) rather than all-URLs content script.

### API Client
- Typed `SpooClient` with automatic auth header injection
- All API responses validated with **Zod schemas** at runtime (catches backend contract drift)
- 401 -> auto-refresh JWT using persistent refresh token -> retry once
- 429 -> respect `Retry-After` header, show user-friendly "rate limited" toast
- All errors wrapped in typed `ApiError` (no thrown exceptions)

### Offline & Error Resilience
- **Network detection**: Listen to `navigator.onLine` + `online`/`offline` events
- **Shorten queue**: When offline, queue shorten requests in `chrome.storage.local`. Process queue when back online. Show "queued" state in UI.
- **TanStack Query retry**: Configure 2 retries with exponential backoff for transient failures
- **Graceful degradation**: If API is unreachable, popup still opens, shows cached history, displays offline banner. Mutations disabled with clear messaging.
- **Error toasts**: All API errors surface as dismissible toasts with actionable messages (not raw error codes)

### Data Fetching (TanStack Query)
- All server state (URL lists, stats, user profile, API keys) managed by **TanStack Query**
- Provides: automatic caching, background refetching, loading/error states, optimistic updates
- Custom hooks in `src/hooks/` wrap query/mutation calls
- Shared query client factory in `src/lib/query-client.ts` — imported by popup and sidepanel entrypoints
- **Zustand** only for client-local state (auth tokens, settings, UI state) — no server data in Zustand

### Validation (Zod)
- API response schemas in `src/schemas/api.ts` — validate every response from spoo.me
- Settings schema in `src/schemas/settings.ts` — validates stored settings + provides defaults
- Storage migration schema in `src/schemas/storage.ts` — safely parses old-format data
- Form validation using Zod schemas directly (no separate form validation library needed)

### Copy-to-Shorten Behavior
- **Opt-in only** (off by default) - less intrusive for new users
- Users explicitly enable via settings toggle
- Shortening always available via popup, context menu, omnibox, and keyboard shortcut
- When enabled, uses `activeTab` + `scripting` permission to detect copy on current tab (not a blanket content script)

### Host Permissions
- `https://spoo.me/*` and `https://qr.spoo.me/*` for API calls
- No `https://*/*` — avoids Chrome Web Store review friction
- Content script only on `spoo.me` (for OAuth flow completion)
- Copy detection via `chrome.scripting.executeScript` + `activeTab` (on-demand, not persistent)

### Publishing
- Not yet published on Chrome Web Store - fresh start
- Migration logic for dev/sideloaded users with old-format storage data
- Migration module is independently testable with unit tests

---

## Features

### Existing (reimplemented)
- URL shortening on copy event detection (opt-in)
- Context menu "Shorten Link"
- QR code generation (classic + gradient)
- URL history with copy/analytics actions
- Export history (CSV/JSON)
- Settings (QR, notifications, theme, auto-copy, stealth mode)
- Light/dark/system theme

### New
- **Authentication**: Full auth - email/password login, OAuth (Google, GitHub, Discord), API key input
- **URL Management**: List all URLs, edit alias/destination, delete, toggle active/inactive
- **Rich Analytics**: Click stats, browser/OS/country/referrer breakdowns
- **Side Panel**: Full dashboard UI with more space than popup (primary rich UI surface, also serves as settings page)
- **Omnibox**: Type `spoo <url>` in address bar to shorten
- **Keyboard Shortcuts**: `Alt+Shift+S` to shorten current page
- **API Key Management**: Create/revoke keys with scoped permissions
- **Batch QR**: Generate multiple QR codes at once
- **System theme**: Auto light/dark based on OS preference
- **Offline queue**: Queued shortening when offline, auto-processes on reconnect

---

## Implementation Phases

### Phase 0: Compatibility Verification
- Verify Bun + WXT compatibility: `bun create wxt` and `bun run dev` / `bun run build`
- Verify Bun works in GitHub Actions CI (use `oven-sh/setup-bun` action)
- If Bun has issues with WXT, fall back to pnpm (document decision)
- **Gate**: Do not proceed until build pipeline works end-to-end

### Phase 1: Scaffolding
- Init WXT + React project with bun
- Configure TS, Biome, Tailwind v4 (CSS-first config in `src/styles/app.css`, no `tailwind.config.ts`)
- Install + init shadcn/ui
- Set up folder structure + manifest
- Add CI workflow: lint (biome) + typecheck (tsc) + build (wxt build) + bundle size check
- Verify: `bun run dev` loads extension, `bun run build` produces output, `bun run lint` passes

### Phase 2: Core Infrastructure
- `src/api/types.ts` - All TypeScript types mirroring backend DTOs
- `src/schemas/*.ts` - Zod schemas for API responses, settings, storage migration
- `src/api/client.ts` - Base HTTP client with auth injection + token refresh + offline detection
- All API modules (shorten, urls, stats, auth, keys, qr, export)
- `src/lib/storage.ts` - WXT storage items (session for access token, local for refresh token + settings)
- `src/lib/messaging.ts` - Typed message protocol
- `src/lib/url-utils.ts` - Consolidated URL validation
- `src/lib/migration.ts` - Old -> new storage migration (independently testable module)
- `src/lib/query-client.ts` - Shared TanStack Query client factory
- `src/stores/*` - Zustand stores for client-only state
- `src/hooks/*` - All TanStack Query hooks

### Phase 3: Background Service Worker
- Run migration on install/update (delegates to `src/lib/migration.ts`)
- Context menu setup + handler
- Message handlers for all protocol messages
- Omnibox integration
- Keyboard shortcut handler
- Token refresh alarm (using persistent refresh token from `local:`)
- Clipboard write via `chrome.scripting.executeScript`
- Offline queue: store pending shortens, process on `online` event

### Phase 4: Popup UI
- Header (logo + user avatar/sign-in + theme toggle)
- Auth UI: login form (email/password), OAuth buttons (Google, GitHub, Discord), API key input, register link
- Quick shorten form with inline result
- Recent history (last 5-10 items)
- Footer (links to side panel, GitHub)
- Auth states: anonymous banner with sign-in CTA, API key badge, logged-in avatar+name
- Offline banner when disconnected

### Phase 5: Side Panel
- **Dashboard tab**: Quick shorten + recent activity
- **URLs tab**: Paginated list, search, sort, filter, per-URL actions (edit, delete, status, stats, copy, QR)
- **Analytics tab**: Per-URL or aggregate stats, CSS-based charts, breakdowns
- **QR tab**: Full QR generator with style/color/gradient/size options + preview + download
- **Settings tab**: All preferences (notification, QR defaults, shortcuts, theme, copy-to-shorten toggle) + API key management
- **Account tab**: Profile, OAuth providers, password, API keys CRUD

### Phase 6: Content Script
- Shadow DOM notification container (injected only on `spoo.me` for OAuth, or on-demand via `executeScript` for copy notifications)
- Modern toast notification UI
- Message handling from background

### Phase 7: Polish & Release
- Migration testing with real old-format data
- Error handling: user-friendly toasts, offline indicator, rate limit messaging
- Loading states: skeleton loaders
- Accessibility: ARIA, keyboard nav
- Cross-browser testing (Chrome, Firefox, Edge)
- Bundle size audit (target <200KB gzipped per entrypoint)
- Store listing assets (screenshots, description, promo images)

---

## Verification

1. `bun run dev` - Extension loads in Chrome with HMR
2. `bun run build` - Clean production build for Chrome + Firefox
3. `bun run lint` - Biome passes with no errors
4. `bun run typecheck` - TypeScript compiles with no errors
5. **Bundle size**: Each entrypoint (popup, sidepanel, background, content) < 200KB gzipped
6. **CI**: GitHub Actions pipeline passes (lint + typecheck + build + size check) with Bun
7. Manual test: shorten a URL via popup, verify it appears in history
8. Manual test: context menu + keyboard shortcut shorten work
9. Manual test: login with API key, verify URL management in side panel
10. Manual test: login with email/password, verify JWT refresh persists across browser restart
11. Manual test: OAuth login via `chrome.identity.launchWebAuthFlow`
12. Manual test: side panel shows full URL list, analytics, and settings
13. Manual test: QR generation with all style options
14. Manual test: settings persist across browser restart
15. Manual test: go offline -> shorten queued -> go online -> queue processes
16. Manual test: migration from old extension data works (test with crafted old-format storage)
17. Manual test: rate limit (429) shows user-friendly message, not raw error
18. **Performance**: Popup opens in <100ms, side panel renders URL list in <200ms
