# CLAUDE.md - Le Filon AO

## Commands
- **Dev**: `npm run dev` (port 3050)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test**: `npm run test` (vitest)
- **Test watch**: `npm run test:watch`
- **Type check**: `npx tsc --noEmit`

## Architecture

### Stack
- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4 (CSS-based config, no tailwind.config)
- **Animation**: framer-motion 11
- **Icons**: lucide-react
- **AI**: Dual-provider (Gemini + Anthropic), voir section IA ci-dessous
- **PDF**: pdf-lib (generation) + pdf-parse v2 (extraction texte)
- **Testing**: Vitest + Testing Library
- **Monitoring**: Sentry (errors) + Plausible (analytics)
- **Deployment**: Vercel (standalone output)

### Backend & Auth
- **API**: Calls `meragel.vercel.app/api/excalibur` for data (dashboard, login, subscribe, checkout)
- **Auth**: JWT stored in localStorage, sent as Bearer token. No client-side crypto verification -- server validates.
- **Storage**: localStorage for workspace state, profile, onboarding. Cloudflare R2 for file uploads.

### Security Headers
Configured in `next.config.ts`: X-Frame-Options DENY, HSTS, CSP (Gemini + Anthropic + Sentry + Plausible), nosniff, strict referrer.

## AI Integration

### Tri-Provider Routing
Le systeme utilise trois fournisseurs IA avec un routing intelligent et cascade :

| Route | Priorite 1 | Priorite 2 | Priorite 3 |
|-------|-----------|-----------|-----------|
| `/api/ai/analyze-dce` | **Anthropic** (Claude Sonnet) | Gemini | NVIDIA |
| `/api/ai/generate-section` | **Gemini** (2.0 Flash) | Anthropic | NVIDIA |
| `/api/ai/coach` | **Gemini** (2.0 Flash) | Anthropic | NVIDIA |

### Env vars IA
- `GEMINI_API_KEY` — Google AI Studio (free tier: 15 RPM, 1M tokens/min)
- `ANTHROPIC_API_KEY` — Console Anthropic ($600 credits)
- `NVIDIA_API_KEY` — NVIDIA NIM (Llama 3.3 70B, free tier)
- Si aucune cle: erreur 503 explicite (pas de mock/fallback)

### Fichiers cles
- `src/lib/ai-client.ts` — Client dual-provider (Gemini + Anthropic), singletons
- `src/app/api/ai/analyze-dce/route.ts` — Upload PDF, extraction texte, analyse DCE
- `src/app/api/ai/generate-section/route.ts` — Generation memoire technique (SSE streaming)
- `src/app/api/ai/coach/route.ts` — Coach IA avec scoring de completude
- `src/hooks/useDceAnalysis.ts` — Hook analyse DCE (states: idle/uploading/analyzing/done/error)
- `src/hooks/useStreamingGeneration.ts` — Hook SSE streaming avec AbortController

### Politique d'erreur
Pas de donnees fictives. Si l'IA est indisponible (cle manquante, API down, reponse mal formatee), l'erreur est affichee clairement a l'utilisateur.

## Project Structure
```
src/
  app/                    # Next.js App Router pages
    dashboard/            # Protected dashboard (main page, AO detail, market, profile)
    api/ai/               # AI endpoints (analyze-dce, generate-section, coach)
    api/documents/        # Document upload/management
    api/gate/             # Auth gate
    login/ pricing/ subscribe/ success/  # Public pages
  components/
    ao/                   # AO detail page components (26 files)
      DceDropZone.tsx     # Overlay drag & drop plein ecran
      MemoireTechniqueBuilder.tsx  # Builder memoire + coach IA
      MemoireSection.tsx  # Section avec regeneration IA streaming
      AiCoachPanel.tsx    # Panneau coach (score ring + suggestions)
      InlineSuggestion.tsx # Suggestion inline par section
    dashboard/            # Dashboard cockpit components (10 files)
    profile/              # Profile management cards (4 files)
    shared/               # Reusable file upload components
    Header.tsx FreeBanner.tsx OnboardingChecklist.tsx
  hooks/                  # Custom hooks (filters, completeness, DCE analysis, streaming)
  lib/                    # Utilities (auth, api, storage, KPI, PDF, AI clients, motion)
    ai-client.ts          # Dual-provider IA (Gemini + Anthropic)
    dev.ts                # Types du domaine (AoDetail, CoachSuggestion, etc.)
    ao-storage.ts         # Persistance localStorage (DCE, sections, workspace)
    __tests__/            # Unit tests (dashboard-kpi, csv sanitization)
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
1. `page.tsx` fetches RFPs from API (falls back to `MOCK_RFPS` in dev mode)
2. `useDashboardFilters` hook manages filter/search/sort state
3. KPI functions in `dashboard-kpi.ts` compute stats from RFP array
4. Workspace state persisted in localStorage per AO id
5. Company profile persisted in localStorage
6. DCE analysis results persisted in localStorage (`lefilonao_dce_{aoId}`)
7. Generated sections persisted in localStorage (`lefilonao_sections_{aoId}`)

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

## Conventions
- French UI text throughout (accents required)
- Immutable patterns: never mutate objects, always spread/create new
- Files < 250 lines, functions < 50 lines
- `'use client'` directive on all interactive components
- No console.log in production code
- All exports from `lib/` are pure functions or typed constants
- No mock/fallback data: errors are errors, shown clearly to the user
