# CLAUDE.md - Le Filon AO

## Commands
- **Dev**: `npm run dev` (port 3050)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test (unit)**: `npm run test` (vitest)
- **Test watch**: `npm run test:watch`
- **Test (E2E)**: `npx playwright test` (38 Playwright tests, requires dev server on port 3050)
- **Type check**: `npx tsc --noEmit`

## Architecture

### Stack
- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4 (CSS-based config, no tailwind.config)
- **Animation**: framer-motion 11
- **Icons**: lucide-react
- **AI**: Tri-provider (Gemini + Anthropic + NVIDIA) avec resilience (cockatiel), voir section IA ci-dessous
- **PDF**: pdf-lib (generation, e-signature, cachet embedding) + pdfjs-dist (spatial text extraction via `pdf-engine.ts`)
- **Rate limiting**: @upstash/ratelimit + @upstash/redis (distributed, Redis-backed) with in-memory fallback for dev
- **Dossier export**: jszip (ZIP dossier complet: DC1, DC2, memoire, documents)
- **Drag & drop**: @dnd-kit/core + @dnd-kit/sortable (section reordering)
- **Testing**: Vitest + Testing Library (unit) + Playwright (E2E, 38 tests)
- **Monitoring**: Sentry (errors) + Plausible (analytics)
- **Deployment**: Vercel (standalone output)

### Backend & Auth
- **API**: Fully local — `src/lib/api.ts` exposes `register()`, `login()`, `checkout()`, `portal()`, `subscription()` (no external auth service)
- **Auth**: Cookie-based HMAC sessions. `lefilonao_access` httpOnly cookie signed with `SESSION_SECRET` (HMAC-SHA256, base64url email + timestamp). 30-day expiry. Constant-time signature verification.
- **Session flow**: `src/lib/session.ts` (`signSession`/`verifySession`) handles cookie crypto. `src/lib/require-auth.ts` (`requireAuth`) extracts email from cookie in API routes. Client-side: `checkAuth()` calls `/api/auth/session`, result cached in memory.
- **Auth routes**: `/api/auth/register` (POST, Zod validation, bcryptjs 12 rounds), `/api/auth/login` (POST, password verify), `/api/auth/logout` (POST, clear cookie), `/api/auth/session` (GET, returns auth state)
- **UserProvider**: `src/components/UserProvider.tsx` — React context providing `useUser()` hook (email, displayName, plan, authenticated)
- **Password**: `src/lib/password.ts` — bcryptjs wrapper (hash/verify, 12 rounds)
- **Storage**: localStorage for workspace state, profile (incl. cachet base64), onboarding. Cloudflare R2 for file uploads.

### Auth Flow
```
Register: POST /api/auth/register → Zod validate → bcrypt hash → Supabase insert → sign cookie → 201
Login:    POST /api/auth/login    → Zod validate → Supabase lookup → bcrypt verify → sign cookie → 200
Logout:   POST /api/auth/logout   → clear cookie → 200
Session:  GET  /api/auth/session  → verify cookie → return {authenticated, email, displayName, plan}
```

Client-side auth state is managed by `UserProvider` (React context). Components use `useUser()` hook. `api.ts` sends all requests with `credentials: 'include'` (browser sends cookie automatically).

### Gate System
- **Gate** uses a separate cookie `lefilonao_gate` (simple HMAC gate pass, no email — just site access control)
- **Auth** uses `lefilonao_access` cookie (contains signed email, used for user identity)
- Gate and auth are independent: gate controls site access, auth controls user identity

### Feature Gating
- **Feature registry**: `src/lib/features.ts` — defines 8 features (ai-scoring, dce-analysis, generate-section, ai-coach, buyer-intelligence, csv-export, daily-alerts, unlimited-ao), each with `minPlan` ('free' | 'pro')
- **Plan source of truth**: `src/lib/require-plan.ts` — `getUserPlan(email)` reads `user_settings.plan` from Supabase (single source, no external service)
- **API gating**: `requireFeature(email, featureKey)` returns 403 if plan insufficient. Used in 8 routes: `/api/ai/analyze-dce`, `/api/ai/generate-section`, `/api/ai/coach`, `/api/market/buyer-profile`, `/api/market/competition`, `/api/market/competitor`, `/api/market/winner-profile`, `/api/market/attributions`
- **Client gating**: `usePlan()` hook fetches plan + feature access. `FeatureGate` wrapper shows `UpgradeModal` for locked features. `ProBadge` marks pro-only UI.
- **Free plan limit**: 5 AO views/month, tracked in `ao_views` table (unique index on user_email + notice_id + month_key). `useAoViews()` hook + `/api/ao-views` route (GET count, POST record).
- **`canAccess(feature, plan)`**: pure function, compares plan rank to feature's `minPlan`

```
Feature Gating Flow (API):
  Request → requireAuth() → requireFeature(email, key) → getUserPlan() → Supabase → canAccess() → 200 or 403

Feature Gating Flow (Client):
  usePlan() → /api/auth/session → plan → canAccess(feature, plan)
  <FeatureGate feature="dce-analysis"> → allowed ? children : <UpgradeModal>
```

### Market Intelligence Backend (Cloudflare Workers)
Le pipeline marche public est decoupe entre deux repos :

**`lefilonao-workers`** (Cloudflare Workers — ecrit dans Supabase) :
- Repo: `github.com/olam-creations/lefilonao-workers`
- URL: `https://lefilonao-workers.olamcreations.workers.dev`
- `syncDecp()` — cron `0 6 * * *` : DECP API → table `decp_attributions`
- `resolveSirets()` — cron `30 6 * * *` : SIRET → nom via Sirene API → `decp_attributions`
- `enrichCompanies()` — cron `0 7 * * *` : Pappers enrichment → `companies`
- `syncBoamp()` + `matchAlerts()` + `sendAlertEmails()` — cron `0 8,14 * * *`
- `POST /scrape-dce` — Scraping DCE headless (Browser Rendering + Puppeteer)

**`lefilonao`** (ce repo — lit depuis Supabase, read-only) :
- `/api/market/insights` — KPIs marche (top buyers, winners, volumes)
- `/api/market/attributions` — Liste des attributions avec filtres
- `/api/market/trends` — Tendances volume par mois
- `/api/market/competitors` — Recherche concurrents par nom/SIRET

Note: Les routes legacy `/api/market/sync` et `/api/market/resolve-names` ont ete supprimees (remplacees par les Workers cron ci-dessus). Le cron Vercel a aussi ete supprime.

```
Cloudflare Worker (cron triggers)         Ce repo (Next.js)
  ├── syncDecp()    → Supabase ←────────── /api/market/insights
  ├── resolveSirets()                ←──── /api/market/attributions
  ├── enrichCompanies()              ←──── /api/market/trends
  ├── syncBoamp() + alerts           ←──── /api/market/competitors
  └── POST /scrape-dce  ←───────────────── /api/ai/fetch-dce (fallback)
       (Browser Rendering)
                                     ───── /api/settings/credentials (CRUD)
                                            → Supabase platform_credentials
```

### DCE Fetch Chain
`/api/ai/fetch-dce` utilise une chaine de fallback pour recuperer les PDF DCE :
1. **Fetch HTTP simple** — requete directe, suit les redirections, extrait PDF depuis HTML
2. **Scraping headless anonyme** — Worker `/scrape-dce` via Puppeteer (Browser Rendering)
3. **Scraping headless authentifie** — meme Worker, avec credentials chiffres depuis Supabase
4. **Upload manuel** — retourne `fallback_url` pour que l'utilisateur uploade le PDF

### Platform Credentials
- Table Supabase `platform_credentials` (chiffrement AES-256-GCM)
- API CRUD : `/api/settings/credentials` (GET/POST/DELETE)
- UI : `PlatformCredentialsCard` dans la page Settings
- Mots de passe jamais retournes en clair par l'API
- Meme `ENCRYPTION_MASTER_KEY` partagee entre Vercel et Workers

### Security Headers
Configured in `next.config.ts`: X-Frame-Options DENY, HSTS, X-Content-Type-Options nosniff, strict Referrer-Policy, Permissions-Policy (camera/mic/geo denied). CSP not currently configured (removed during auth rewrite — to be re-added).

## AI Integration

### Tri-Provider Routing (DIF — Deterministic Intent Folding)
Le systeme utilise trois fournisseurs IA avec `resilientCascade()` — circuit breakers, retry + exponential backoff, timeout (via `cockatiel`) :

| Route | Priorite 1 | Priorite 2 | Priorite 3 |
|-------|-----------|-----------|-----------|
| `/api/ai/analyze-dce` | **Anthropic** (Claude Sonnet) | Gemini | NVIDIA |
| `/api/ai/generate-section` | **Gemini** (2.0 Flash) | Anthropic | NVIDIA |
| `/api/ai/coach` | **Gemini** (2.0 Flash) | Anthropic | NVIDIA |

Comportement resilience par provider :
- **Retry**: 2 tentatives max, backoff exponentiel (500ms → 5s)
- **Circuit breaker**: ouvert apres 3 echecs consecutifs, cooldown 60s
- **Timeout**: 90s par appel (aggressive — annule l'appel)
- **Cascade**: si un provider echoue (ou circuit ouvert), passe au suivant automatiquement

### Audit Logging
Tous les appels IA sont traces via `measureAiCall()` (`src/lib/ai-audit.ts`) :
- Intent, provider, model, latence, succes/erreur, tokens (quand dispo)
- Stockage in-memory (200 entries max, dev uniquement)
- `getRecentLogs(limit)` pour consultation

### Plan Executor
Orchestration multi-step via `executePlan()` (`src/lib/ai-plan.ts`) :
- Steps sequentiels avec injection de variables `{{step[N].result.path}}`
- Callback `onStepChange` pour mise a jour UI en temps reel
- Support `AbortSignal` pour annulation
- Templates pre-construits : `createBatchGeneratePlan()`, `createFullAnalysisPlan()`
- Hook React `useAiPlan()` pour state management (progress, currentStep, abort)

### Env vars IA
- `GEMINI_API_KEY` — Google AI Studio (free tier: 15 RPM, 1M tokens/min)
- `ANTHROPIC_API_KEY` — Console Anthropic ($600 credits)
- `NVIDIA_API_KEY` — NVIDIA NIM (Llama 3.3 70B, free tier)
- Si aucune cle: erreur 503 explicite (pas de mock/fallback)

### TOON Encoding
- Prompts IA utilisent TOON (Token-Oriented Object Notation) pour les donnees structurees (profil, references, equipe, sections, criteres) — ~40% de tokens en moins
- Source: `src/lib/toon.ts` (jsonToToon)

### Fichiers cles
- `src/lib/toon.ts` — TOON encoder (`jsonToToon`) — compact tabular format pour prompts IA
- `src/lib/ai-client.ts` — Client tri-provider (Gemini + Anthropic + NVIDIA), singletons
- `src/lib/ai-resilience.ts` — Circuit breakers, retry, timeout, `resilientCascade()` (cockatiel)
- `src/lib/ai-audit.ts` — Audit logging pour tous les appels IA (`measureAiCall()`)
- `src/lib/ai-plan.ts` — Plan executor sequentiel avec variable injection
- `src/lib/ai-plan-templates.ts` — Templates de plans (batch generate, full analysis)
- `src/app/api/ai/analyze-dce/route.ts` — Upload PDF, extraction texte, analyse DCE
- `src/app/api/ai/generate-section/route.ts` — Generation memoire technique (SSE streaming)
- `src/app/api/ai/coach/route.ts` — Coach IA avec scoring de completude
- `src/hooks/useAiPlan.ts` — Hook React pour execution de plans IA (state, progress, abort)
- `src/hooks/useDceAnalysis.ts` — Hook analyse DCE (states: idle/uploading/analyzing/done/error)
- `src/hooks/useStreamingGeneration.ts` — Hook SSE streaming avec AbortController

## Rate Limiting

### Architecture (`src/lib/rate-limit.ts`)
- **Production**: Upstash Redis-backed sliding window (distributed, works across Vercel instances)
- **Development**: In-memory fallback (no Redis required, auto-cleanup every 5 min)
- **API**: `rateLimit(req, options)` returns `null` (allowed) or `429 Response` (exceeded)

### Presets
| Preset | Limit | Window | Used by |
|--------|-------|--------|---------|
| `AUTH_LIMIT` | 5 req | 60s | `/api/auth/*`, `/api/gate` |
| `AI_LIMIT` | 10 req | 60s | `/api/ai/*` |
| `STANDARD_LIMIT` | 60 req | 60s | All other API routes |

## Agent Architecture

### `src/lib/agents/`
- `base-agent.ts` — Abstract `BaseAgent<TInput, TOutput>` class with `AgentContext` (userId, plan, history) and `AgentResult<T>` (success, data, error, usage). Inspired by Mastra.ai / Vercel AI SDK.
- `dce-agent.ts` — `DceAgent` extends BaseAgent, analyzes PDF DCE documents via the resilient cascade.
- `orchestrator.ts` — `FilonOrchestrator` singleton, central entry point for multi-agent coordination. Currently exposes `dceAgent`.

## PDF Generation & Extraction

### Architecture
- `src/lib/pdf-engine.ts` — High-fidelity PDF text extraction via pdfjs-dist (spatial layout-preserving, replaces pdf-parse for extraction)
- `src/lib/pdf-utils.ts` — Shared drawing primitives (top-down coordinate system, y flows downward)
- `src/lib/pdf-dc1.ts` — Lettre de candidature (2 pages: identification + engagement/signature)
- `src/lib/pdf-dc2.ts` — Declaration du candidat (2 pages: identification/financials + references/attestation)
- `src/lib/dossier-export.ts` — Full dossier ZIP export (DC1 + DC2 + memoire technique + uploaded documents) via jszip

### Fonctionnalites
- **Cachet entreprise**: image PNG/JPG embeddee depuis `CompanyProfile.cachetBase64`
- **E-signature**: `ESignData` (nom, lieu, date) pour signature electronique
- **Formulaires editables**: champs PDF remplissables (lot, CA, moyens techniques, refs)
- **Design pro**: palette muted (`C.black`, `C.dark`, `C.mid`, `C.accent`), sans bordures de page

### Conventions pdf-utils
- `y` = top de l'element a dessiner, tous les elements descendent
- Chaque fonction retourne le `y` du prochain element (gap inclus)
- `afterFieldBlocks(y)` apres les blocs side-by-side (`drawFieldBlock`)
- `drawContinuationHeader()` pour les pages 2+

### Politique d'erreur
Pas de donnees fictives. Si l'IA est indisponible (cle manquante, API down, reponse mal formatee), l'erreur est affichee clairement a l'utilisateur.

## Project Structure
```
src/
  app/                    # Next.js App Router pages
    dashboard/            # Protected dashboard (main page, AO detail, market, profile, watchlist)
    api/auth/             # Auth endpoints (cookie-based HMAC)
      register/route.ts   # POST — Zod validation, bcrypt hash, create user, sign cookie
      login/route.ts      # POST — password verify, sign cookie
      logout/route.ts     # POST — clear cookie
      session/route.ts    # GET — verify cookie, return auth state
    api/ai/               # AI endpoints (analyze-dce, generate-section, coach, fetch-dce) — pro-gated
    api/ao-views/route.ts # GET count + POST record AO view (free plan tracking)
    api/market/           # Market intelligence (read-only from Supabase, some pro-gated)
      insights/           # KPIs, top buyers/winners
      attributions/       # Attribution list with filters (pro-gated)
      trends/             # Volume by month
      competitors/        # Competitor search
      buyer-profile/      # Buyer intelligence (pro-gated)
      competition/        # Competition analysis (pro-gated)
      competitor/         # Competitor detail (pro-gated)
      winner-profile/     # Winner analysis (pro-gated)
    api/watchlist/        # Watchlist acheteurs (CRUD + alerts)
      route.ts            # GET list, POST add buyer
      [id]/route.ts       # DELETE remove buyer
      check/route.ts      # GET check if buyer is watched
      alerts/route.ts     # GET recent AO from watched buyers (30d)
    api/settings/
      route.ts            # GET/PATCH user settings
      credentials/route.ts # GET/POST/DELETE platform credentials (AES-256-GCM)
    api/stripe/           # Stripe endpoints (checkout, portal, subscription, webhook)
    api/documents/        # Document upload/management (upload, generate-pdf)
    api/alerts/           # Alert matches
    api/feedback/         # Founder feedback
    api/geo/              # Address/geocoding
    api/opportunities/    # Opportunity search
    api/pipeline/         # Pipeline stats
    api/rfps/             # RFP CRUD
    api/gate/             # Site-level gate (separate from auth)
    login/ pricing/ subscribe/ success/  # Public pages
    cgu/ cgv/ mentions-legales/ politique-confidentialite/  # Legal pages
  components/
    UserProvider.tsx       # React context for auth state (useUser hook)
    ao/                   # AO detail page components (26 files)
      DceDropZone.tsx     # Overlay drag & drop plein ecran
      MemoireTechniqueBuilder.tsx  # Builder memoire + coach IA
      MemoireSection.tsx  # Section avec regeneration IA streaming
      AiCoachPanel.tsx    # Panneau coach (score ring + suggestions)
      InlineSuggestion.tsx # Suggestion inline par section
    dashboard/            # Dashboard cockpit components (10 files)
    watchlist/            # Watchlist acheteurs (3 files)
      WatchButton.tsx     # Heart toggle (optimistic UI, used in EntitySheet)
      WatchlistPage.tsx   # Full page: stats, buyer list, alert feed
      WatchlistAlertsFeed.tsx # Recent AO cards from watched buyers
    settings/             # Settings page components
      PlatformCredentialsCard.tsx # CRUD identifiants plateformes (AES-256-GCM)
    profile/              # Profile management cards (5 files)
      CachetUploadCard.tsx  # Upload cachet entreprise (PNG/JPG, base64 → PDF)
    shared/               # Reusable components
      FeatureGate.tsx     # Wrapper: renders children if feature allowed, else UpgradeModal
      ProBadge.tsx        # "Pro" badge for pro-only UI elements
      UpgradeModal.tsx    # Modal prompting upgrade to Pro plan
      Logo.tsx FileUploadZone.tsx FileRow.tsx DashboardShell.tsx
    Header.tsx FreeBanner.tsx OnboardingChecklist.tsx StripeCheckoutModal.tsx
  hooks/                  # Custom hooks
    useAiPlan.ts          # Hook execution plans IA (state, progress, abort)
    usePlan.ts            # Plan + feature access hook (calls /api/auth/session)
    useAoViews.ts         # AO view count + record hook (calls /api/ao-views)
    useDashboardFilters.ts # Filter/search/sort state for dashboard
    useDceAnalysis.ts     # DCE analysis states (idle/uploading/analyzing/done/error)
    useStreamingGeneration.ts # SSE streaming with AbortController
    useCompanyCompleteness.ts # Profile completeness scoring
    useUserSettings.ts    # User settings CRUD hook
  lib/                    # Utilities
    auth.ts               # Client-side auth: checkAuth(), logout(), clearAuthCache(), onboarding
    api.ts                # API client: register(), login(), checkout(), portal(), subscription()
    session.ts            # Cookie crypto: signSession(), verifySession() (HMAC-SHA256)
    require-auth.ts       # Server-side: requireAuth(req) — extract email from cookie or 401
    password.ts           # bcryptjs wrapper: hashPassword(), verifyPassword() (12 rounds)
    features.ts           # Feature registry: FEATURES, canAccess(), FREE_AO_LIMIT
    require-plan.ts       # getUserPlan(email), requireFeature(email, key), requirePro(email)
    validators.ts         # Zod schemas: loginSchema, registerSchema, setPasswordSchema, + domain schemas
    stripe.ts             # Stripe: checkout, portal, webhook, cancel, getSubscription
    ai-client.ts          # Tri-provider IA (Gemini + Anthropic + NVIDIA), singletons
    ai-resilience.ts      # Circuit breakers, retry, timeout, resilientCascade() (cockatiel)
    ai-audit.ts           # Audit logging appels IA (measureAiCall, getRecentLogs)
    ai-plan.ts            # Plan executor sequentiel avec variable injection
    ai-plan-templates.ts  # Templates de plans (batch generate, full analysis)
    crypto-utils.ts       # AES-256-GCM encrypt/decrypt (node:crypto, interop avec Workers)
    pdf-engine.ts         # High-fidelity PDF text extraction (pdfjs-dist, spatial layout)
    dossier-export.ts     # Full dossier ZIP export (DC1 + DC2 + memoire + documents)
    dce-analyzer.ts       # DCE PDF analysis orchestration
    r2-client.ts          # Cloudflare R2 file storage (S3-compatible)
    file-storage.ts       # File download/trigger helpers
    rate-limit.ts         # Per-IP rate limiter (Upstash Redis distributed, in-memory fallback)
    sanitize-search.ts    # Search input sanitization
    winnability-score.ts  # AO winnability scoring algorithm
    notice-transform.ts   # Notice data transformation
    profile-storage.ts    # Profile localStorage persistence
    ao-utils.ts           # AO workspace state types + utilities
    dev.ts                # Types du domaine (AoDetail, CompanyProfile w/ cachetBase64, etc.)
    ao-storage.ts         # Persistance localStorage (DCE, sections, workspace)
    supabase.ts           # Supabase client singleton (server + client)
    agents/               # Agent architecture (base-agent, dce-agent, orchestrator)
    __tests__/            # Unit tests (dashboard-kpi, csv sanitization, ia-engine)
e2e/                      # Playwright E2E tests
  auth.spec.ts            # Auth journeys: login, dev access, logout, registration, API routes, protected routes
  feature-gating.spec.ts  # Feature gating API + auth cookie structure tests
  global-setup.ts         # Rate-limit-aware setup (waits for 60s window between runs)
supabase/migrations/      # Database migrations (001-023), run via Management API
```

## Key Patterns

### Design System (CSS classes)
- Cards: `glass` (glassmorphism), `bg-white rounded-xl border`
- Badges: `badge-go` (emerald), `badge-maybe` (amber), `badge-pass` (slate)
- Glows: `glow-emerald`, `glow-amber`
- Buttons: `btn-primary` (indigo gradient), `btn-secondary`
- Progress: `progress-bar`, `progress-bar-fill`
- Skeleton: `skeleton` class for loading states
- Animation: `animate-pulse-dot`, `animate-fade-up`

### Motion Variants (framer-motion)
`fadeUp`, `stagger`, `scaleIn`, `expandCollapse` from `src/lib/motion-variants.ts`

### Data Flow
1. `UserProvider` wraps app — calls `checkAuth()` on mount, provides `useUser()` context
2. `page.tsx` fetches RFPs from API (falls back to `MOCK_RFPS` in dev mode)
3. `useDashboardFilters` hook manages filter/search/sort state
4. KPI functions in `dashboard-kpi.ts` compute stats from RFP array
5. Workspace state persisted in localStorage per AO id
6. Company profile persisted in localStorage
7. DCE analysis results persisted in localStorage (`lefilonao_dce_{aoId}`)
8. Generated sections persisted in localStorage (`lefilonao_sections_{aoId}`)
9. Company cachet (stamp image) persisted as base64 in profile, embedded in DC1/DC2 PDFs
10. Plan/feature access: `usePlan()` reads plan from session, `canAccess()` checks features client-side
11. AO view tracking: `useAoViews()` reads/writes via `/api/ao-views`, enforced in `FreeBanner`

### RFP Type (canonical: `src/hooks/useDashboardFilters.ts`)
```typescript
interface RFP {
  id, title, issuer, deadline, score, scoreLabel ('GO'|'MAYBE'|'PASS'),
  budget, region, source, url, publishedAt
}
```

## Monitoring & Analytics
- **Sentry** (error tracking): 14-day trial started ~Feb 9, 2026 (expires ~Feb 23)
- **Plausible** (analytics): 30-day trial started ~Feb 9, 2026 (expires ~Mar 11)
- Domain: `lefilonao.com` | Org: `olam-creations`

## E2E Testing (Playwright)

### Setup
- Config: `playwright.config.ts` — Chromium only, serial execution (workers=1), baseURL `http://localhost:3050`
- Global setup: `e2e/global-setup.ts` — Rate-limit-aware: detects consecutive runs and waits for the 60s rate limit window to expire before running tests

### Test Files (38 tests total)
- `e2e/auth.spec.ts` — 7 journeys: login form, dev access button, logout, registration flow (2-step: account + preferences), auth API routes (validation, session, register), protected routes
- `e2e/feature-gating.spec.ts` — Feature gating API validation (403 for free users on pro features), auth cookie structure tests

### Rate Limit Handling
Auth endpoints have 5 req/min limit. Tests accept 429 as valid response and skip gracefully. Global setup uses timestamp file to auto-wait between runs.

## RGPD & Legal
- 4 pages legales: mentions legales, politique de confidentialite, CGU, CGV
- Cookie banner avec consentement (Sentry conditionnel au consentement)
- Badges IA sur les contenus generes par intelligence artificielle
- Pages: `/mentions-legales`, `/politique-de-confidentialite`, `/cgu`, `/cgv`
- TVA non applicable, article 293 B du CGI (franchise en base, micro-entreprise)

## Stripe — Paiement

### Account & Resources
- **Account**: `acct_1SyeywBDkKUCWueH` (Olam Creations)
- **Product**: `prod_TxCM7iGqGzQBmt` (live) / `prod_TxCNNuTyA7815Y` (test)

| Resource | Live ID | Test ID | Description |
|----------|---------|---------|-------------|
| Prix Standard | `price_1SzHyIBDkKUCWueHhm8fhRAT` | — | 50 EUR/mois (pour plus tard) |
| Prix Fondateur | `price_1SzHyKBDkKUCWueH8GmbbK7w` | `price_1SzHz7BYsEp2QzaQU5CZeFMx` | 40 EUR/mois (base fondateur) |
| Coupon Fondateur | `rqtjQwoe` | `lvVL2gwK` | -15 EUR x6 mois |

### Pricing Logic
```
Fondateur (actuel):
  Prix base = 40 EUR/mois + coupon -15 EUR (6 mois)
  → Mois 1-6 : 25 EUR/mois (automatique Stripe)
  → Mois 7+  : 40 EUR/mois (coupon expire automatiquement)

Standard (futur, quand places fondateur epuisees):
  Prix base = 50 EUR/mois, pas de coupon
  → Changer STRIPE_PRICE_PRO_MONTHLY au prix standard
  → Supprimer STRIPE_COUPON_FOUNDER de l'env
  → Les fondateurs existants gardent leur coupon
```

### Checkout Flow
```
subscribe page → api.checkout() → POST /api/stripe/checkout
  → createCheckoutSession(email, returnUrl)
    → price = STRIPE_PRICE_PRO_MONTHLY (40 EUR fondateur)
    → discounts = [{ coupon: STRIPE_COUPON_FOUNDER }] (si defini)
  → Stripe Embedded Checkout (StripeCheckoutModal)
  → return_url = /success?session_id={CHECKOUT_SESSION_ID}
```

### Webhook Events
Endpoint: `/api/stripe/webhook` (webhook endpoint: `we_1SzI1TBDkKUCWueHBrJw0Yh8`) — verifie signature via `STRIPE_WEBHOOK_SECRET`
- `checkout.session.completed` → plan='pro', save stripe_customer_id + subscription_id
- `customer.subscription.updated` → sync status, cancel_at_period_end, current_period_end
- `customer.subscription.deleted` → plan='free', stripe_status='canceled'
- `invoice.payment_failed` → stripe_status='past_due'

### Cancellation Policy
- `cancel_at_period_end: true` — acces maintenu jusqu'a fin de periode, pas de remboursement
- CGV: "Aucun remboursement au prorata. Apres resiliation, le compte repasse sur l'offre Gratuite."
- Client: SubscriptionCard affiche "Actif jusqu'au {date}" quand cancelAtPeriodEnd=true

## Vercel Env Vars (Production)
- `SESSION_SECRET` — HMAC secret for cookie signing (must NOT be the same as SITE_PASSWORD)
- `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `NVIDIA_API_KEY` — IA providers
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` — Market Intelligence
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Client-side Supabase
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `NEXT_PUBLIC_SENTRY_DSN` — Error tracking
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — Analytics (lefilonao.com)
- `ALLOWED_EMAILS`, `SITE_PASSWORD` — Gate access control (site-level password gate)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe auth
- `STRIPE_PRICE_PRO_MONTHLY` — Active price ID (fondateur=40EUR, standard=50EUR)
- `STRIPE_COUPON_FOUNDER` — Coupon ID (-15EUR x6 mois, omit to disable founder pricing)
- `NEXT_PUBLIC_APP_URL` — App base URL (used for Stripe return URLs, default `http://localhost:3050`)
- `WORKER_URL` — Cloudflare Worker URL (`https://lefilonao-workers.olamcreations.workers.dev`)
- `WORKER_AUTH_TOKEN` — Secret partage avec Worker pour auth `/scrape-dce`
- `ENCRYPTION_MASTER_KEY` — Cle 32 octets hex pour AES-256-GCM (meme que Worker)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET` — Cloudflare R2 file storage (bucket: `lefilonao-documents`)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Distributed rate limiting (optional, falls back to in-memory in dev)
- `SUPABASE_ACCESS_TOKEN` — Management API (for migrations via `api.supabase.com`)
- `POSTGRES_*` — Database (via Supabase)
- ~~`NEXT_PUBLIC_API_URL`~~ — REMOVED (meragel dependency eliminated, all auth is local)

## Supabase Migrations

23 migrations in `supabase/migrations/` (001-023). Run via the Management API:

```bash
node scripts/run-migration.mjs $(npx vercel env run --environment production -- node -e "process.stdout.write(process.env.SUPABASE_ACCESS_TOKEN)")
```

Or let Vercel inject the token automatically:
```bash
npx vercel env run --environment production -- node scripts/run-migration.mjs supabase/migrations/XXX.sql
```

Project ref: `vdatbrdkwwedetdlbqxx`

## Database (Auth, Billing & Feature Gating)
- `user_settings` table — columns: `user_email` (PK), `plan` ('free'|'pro'), `password_hash` (bcrypt), `first_name`, `company`, `display_name`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_status` ('none'|'active'|'past_due'|'canceled'), `current_period_end`, `cancel_at_period_end`, + settings fields
- `ao_views` table — columns: `id` (UUID PK), `user_email`, `notice_id`, `month_key` (YYYY-MM), `viewed_at`. Unique index on `(user_email, notice_id, month_key)`. Tracks free-plan AO view limits.
- `platform_credentials` table — AES-256-GCM encrypted platform login credentials
- Plan is read exclusively via `getUserPlan(email)` from `user_settings.plan` — single source of truth (no external service)
- Stripe webhook updates `user_settings` directly (plan, stripe_status, current_period_end, cancel_at_period_end)

### Migrations (supabase/migrations/)
23 migrations total (001-023). Key recent migrations:
- `016_stripe_billing.sql` — Stripe columns on user_settings (customer_id, subscription_id, status, period_end, cancel)
- `017_rls_defense_in_depth.sql` — RLS policies for all tables (anon key cannot access user data)
- `019_auth_fields.sql` — password_hash, first_name, company columns for local auth
- `020_ao_views.sql` — ao_views table for free plan metering
- `021_drop_unused_indexes.sql` — Cleanup unused indexes (Supabase linter)
- `022_index_foreign_keys.sql` — FK covering indexes for JOIN/CASCADE performance
- `023_index_decp_cpv_sector.sql` — Composite index for market query performance

## Conventions
- French UI text throughout (accents required)
- Immutable patterns: never mutate objects, always spread/create new
- Files < 250 lines, functions < 50 lines
- `'use client'` directive on all interactive components
- No console.log in production code
- All exports from `lib/` are pure functions or typed constants
- No mock/fallback data: errors are errors, shown clearly to the user
