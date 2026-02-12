# Codemap - Le Filon AO

> AI-readable codebase navigation guide. Last updated: 2026-02-11.

## Module Overview

```
src/
├── app/                          # ROUTES & PAGES
│   ├── page.tsx                  # Landing page (public)
│   ├── layout.tsx                # Root layout (Sentry, Plausible, fonts)
│   ├── globals.css               # Tailwind v4 theme + custom components
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard orchestrator (auth-guarded)
│   │   ├── ao/[id]/page.tsx      # AO detail view (5 tabs)
│   │   ├── market/page.tsx       # Market intelligence
│   │   └── profile/page.tsx      # Company profile editor
│   ├── api/
│   │   ├── ai/analyze-dce/       # POST: Analyze DCE documents with AI
│   │   ├── ai/coach/             # POST: AI coaching responses
│   │   ├── ai/generate-section/  # POST: Generate memoire sections
│   │   ├── documents/upload/     # POST: Upload files to R2
│   │   ├── documents/[id]/       # GET: Retrieve uploaded file
│   │   └── gate/                 # GET: Auth gate redirect
│   ├── login/                    # Magic link login
│   ├── pricing/                  # Pricing page
│   ├── subscribe/                # Subscription form
│   └── success/                  # Post-payment confirmation
│
├── components/
│   ├── dashboard/                # DASHBOARD COCKPIT
│   │   ├── KpiStatsSection.tsx   # 4-card KPI grid (pipeline, deadlines, profile, response rate)
│   │   ├── KpiStatCard.tsx       # Single KPI card with count-up animation
│   │   ├── ProfileCompletenessRing.tsx  # SVG donut ring
│   │   ├── DeadlineTimeline.tsx  # Horizontal scrollable timeline
│   │   ├── QuickActionsBar.tsx   # Alert pills (expired docs, urgent deadlines)
│   │   ├── FiltersToolbar.tsx    # Search + filters + sort + export CSV
│   │   ├── ActiveFilterChips.tsx # Removable filter chips with AnimatePresence
│   │   ├── AoCard.tsx            # Single AO card (score badge, countdown, progress)
│   │   ├── AoCardList.tsx        # Animated card list wrapper
│   │   └── DashboardSkeletons.tsx # Loading skeletons
│   │
│   ├── ao/                       # AO DETAIL VIEW
│   │   ├── AoHeroHeader.tsx      # Hero with score, deadline, issuer
│   │   ├── AoTabBar.tsx          # Tab navigation (Essentiel, Analyse, Reponse, Marche)
│   │   ├── TabEssentiel.tsx      # Summary tab
│   │   ├── TabAnalyse.tsx        # AI analysis tab
│   │   ├── TabReponse.tsx        # Response builder tab
│   │   ├── TabMarche.tsx         # Market intelligence tab
│   │   ├── MemoireTechniqueBuilder.tsx  # Memoire technique editor
│   │   ├── MemoireSection.tsx    # Individual section with AI generation
│   │   ├── DocumentPreparationCenter.tsx # Document checklist
│   │   ├── DceDropZone.tsx       # DCE file upload zone
│   │   ├── AiCoachPanel.tsx      # AI coaching sidebar
│   │   ├── AiSummaryCard.tsx     # AI-generated summary
│   │   ├── InlineSuggestion.tsx  # Inline AI suggestions
│   │   ├── ScoreDetails.tsx      # Score breakdown
│   │   ├── DecisionCard.tsx      # Go/No-Go decision
│   │   ├── ComplianceChecklist.tsx # Compliance checks
│   │   ├── DeadlineCountdown.tsx # Countdown timer
│   │   ├── RecommendationCard.tsx # Strategic recommendations
│   │   ├── ResponseTimeline.tsx  # Response preparation timeline
│   │   ├── SelectionCriteriaWeights.tsx # Criteria weight visualization
│   │   ├── VigilanceAlerts.tsx   # Risk alerts
│   │   ├── MarketIntelligence.tsx # Market data
│   │   ├── DossierExportCard.tsx # Export dossier to PDF/ZIP
│   │   ├── DocumentSplitView.tsx # Side-by-side doc view
│   │   ├── AoSidebar.tsx         # Sidebar navigation
│   │   └── CopyButton.tsx        # Copy-to-clipboard utility
│   │
│   ├── profile/                  # PROFILE MANAGEMENT
│   │   ├── CompanyInfoCard.tsx   # Company information form
│   │   ├── AdminDocumentsCard.tsx # Administrative documents
│   │   ├── SectorsRegionsCard.tsx # Sectors & regions selection
│   │   └── TeamReferencesCard.tsx # Team members & project references
│   │
│   ├── shared/                   # SHARED COMPONENTS
│   │   ├── FileUploadZone.tsx    # Drag-and-drop file upload
│   │   └── FileRow.tsx           # File list item
│   │
│   ├── Header.tsx                # Main navigation bar
│   ├── FreeBanner.tsx            # Free plan limitation banner
│   └── OnboardingChecklist.tsx   # Setup wizard steps
│
├── hooks/
│   ├── useDashboardFilters.ts    # Filter/search/sort state (canonical RFP type)
│   ├── useCompanyCompleteness.ts # Profile completeness computation
│   ├── useDceAnalysis.ts         # DCE file analysis with AI
│   └── useStreamingGeneration.ts # SSE streaming for AI responses
│
├── lib/
│   ├── api.ts                    # API client (authenticatedFetch, api.dashboard/login/etc)
│   ├── auth.ts                   # JWT token management, onboarding state
│   ├── ao-utils.ts               # daysUntil, formatDate, computeProgress, computeTimeline
│   ├── ao-storage.ts             # localStorage CRUD for workspace state per AO
│   ├── profile-storage.ts        # localStorage CRUD for company profile
│   ├── dashboard-kpi.ts          # Pure KPI computation (pipeline, deadline, profile, response rate)
│   ├── dev.ts                    # Dev mode flag, MOCK_RFPS, MOCK_COMPANY_PROFILE, type defs
│   ├── motion-variants.ts        # framer-motion presets (fadeUp, stagger, scaleIn, expandCollapse)
│   ├── ai-client.ts              # Anthropic + Gemini AI client wrapper
│   ├── ai-fallback.ts            # Fallback when AI unavailable
│   ├── dossier-export.ts         # PDF/ZIP export logic
│   ├── pdf-dc1.ts                # DC1 form PDF generation
│   ├── pdf-dc2.ts                # DC2 form PDF generation
│   ├── pdf-utils.ts              # PDF helper utilities
│   ├── file-storage.ts           # File metadata management
│   ├── r2-client.ts              # Cloudflare R2 S3-compatible client
│   └── __tests__/
│       ├── dashboard-kpi.test.ts # 14 tests: pipeline, deadline, profile, response rate KPIs
│       └── sanitize-csv.test.ts  # 12 tests: CSV formula injection prevention
```

## Data Flow

```
User Browser
  │
  ├── GET /dashboard ──► page.tsx
  │     │
  │     ├── Supabase (boamp_notices) ──► RFP list
  │     │
  │     ├── getWorkspaceState(id) ──► localStorage (per AO workspace)
  │     ├── getCompanyProfile() ──► localStorage (company profile)
  │     │
  │     ├── computePipelineKpi(rfps) ──► { total, go, maybe, pass }
  │     ├── computeDeadlineKpi(rfps) ──► { urgentCount, nextDeadline }
  │     ├── computeProfileKpi(profile) ──► { completenessPercent }
  │     ├── computeResponseRateKpi(ids, ws) ──► { decided, total, percent }
  │     │
  │     └── useDashboardFilters(rfps) ──► filteredRfps, activeFilters, sort
  │
  ├── GET /dashboard/ao/[id] ──► AO detail page
  │     ├── AI endpoints: /api/ai/analyze-dce, /api/ai/coach, /api/ai/generate-section
  │     ├── File uploads: /api/documents/upload ──► Cloudflare R2
  │     └── Market intel: /api/market/* ──► Supabase (decp_attributions)
  │
  ├── GET /dashboard/market ──► Market Intelligence
  │     └── /api/market/* + /api/intel/* ──► Supabase (decp_attributions, companies)
  │
  └── GET /dashboard/profile ──► Profile editor
        └── profile-storage.ts ──► localStorage

Backend (FastAPI — lefilonao-api repo, Railway):
  ├── /api/search/opportunities ──► Meilisearch (boamp_notices index)
  ├── /api/ai/* ──► Tri-provider (Gemini + Anthropic + NVIDIA)
  ├── /api/batch/analyze ──► ARQ queue → dce_analyses table
  ├── /api/market/* (6 routes) ──► Supabase (decp_attributions)
  ├── /api/intel/* (6 routes) ──► Supabase (decp_attributions, companies, user_watchlist)
  └── /api/opportunities/{id}/* ──► Supabase (boamp_lots, boamp_amendments)

Background (Cloudflare Workers — lefilonao-workers repo):
  ├── syncDecp() ──► DECP API → Supabase decp_attributions
  ├── syncBoamp() ──► BOAMP API → Supabase boamp_notices
  ├── resolveSirets() ──► Sirene API → Supabase decp_attributions
  ├── enrichCompanies() ──► Pappers API → Supabase companies
  └── matchAlerts() + sendAlertEmails() ──► Resend
```

## Key Types

| Type | Location | Purpose |
|------|----------|---------|
| `RFP` | `hooks/useDashboardFilters.ts` | Canonical AO type (11 fields) |
| `CompanyProfile` | `lib/dev.ts` | Company with docs, team, refs, sectors, regions |
| `WorkspaceState` | `lib/ao-utils.ts` | Per-AO workspace (decision, docs ready, sections) |
| `ProfileDocument` | `lib/dev.ts` | Document with status (valid/expiring/expired/missing) |
| `PipelineKpi` | `lib/dashboard-kpi.ts` | {total, go, maybe, pass} |
| `DeadlineKpi` | `lib/dashboard-kpi.ts` | {urgentCount, nextDeadlineDate, nextDeadlineDays} |
| `ScoreLabel` | `hooks/useDashboardFilters.ts` | 'GO' \| 'MAYBE' \| 'PASS' |
| `SortKey` | `hooks/useDashboardFilters.ts` | 6 sort options |

## Component Hierarchy (Dashboard)

```
DashboardPage
  ├── Header
  ├── FreeBanner
  ├── OnboardingChecklist
  ├── KpiStatsSection
  │     ├── KpiStatCard (pipeline) ──► PipelineBar
  │     ├── KpiStatCard (deadlines)
  │     ├── KpiStatCard (profile) ──► ProfileCompletenessRing
  │     └── KpiStatCard (response rate)
  ├── DeadlineTimeline
  ├── QuickActionsBar
  ├── FiltersToolbar
  ├── ActiveFilterChips
  └── AoCardList
        └── AoCard (x N)
```

## External Dependencies

| Service | Usage | Config |
|---------|-------|--------|
| Supabase | Database (PostgreSQL), source unique de verite | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| FastAPI (Railway) | Search, AI, market intelligence backend | `FASTAPI_URL` (futur proxy) |
| CF Workers | BOAMP/DECP sync, DCE scraping | `WORKER_URL`, `WORKER_AUTH_TOKEN` |
| Meilisearch | Search instantane avec facettes | Via FastAPI backend |
| Cloudflare R2 | File storage | `R2_*` env vars |
| Anthropic Claude | AI analysis (provider 1 pour analyze-dce) | `ANTHROPIC_API_KEY` |
| Google Gemini | AI generation (provider 1 pour generate/coach) | `GEMINI_API_KEY` |
| NVIDIA NIM | AI fallback (Llama 3.3 70B) | `NVIDIA_API_KEY` |
| Stripe | Billing & subscriptions | `STRIPE_*` env vars |
| Upstash Redis | Distributed rate limiting | `UPSTASH_REDIS_*` env vars |
| Sentry | Error tracking | `SENTRY_*` env vars |
| Plausible | Analytics | Script in layout.tsx |
| Vercel | Next.js hosting | `.vercel/` config |
