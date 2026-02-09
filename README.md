# Le Filon AO

Trouvez le filon des marches publics.

https://lefilonao.com

SaaS B2G qui aide les PME francaises a identifier, analyser et repondre aux appels d'offres publics. IA integree pour l'analyse de DCE, la generation de memoires techniques et le coaching en temps reel.

## Stack

- **Next.js 16** (App Router) + React 19
- **Tailwind CSS 4** + Framer Motion
- **IA dual-provider** : Gemini 2.0 Flash (streaming, coach) + Anthropic Claude Sonnet (analyse DCE)
- **PDF** : pdf-lib (generation) + pdf-parse (extraction)
- **Monitoring** : Sentry + Plausible
- **Deploiement** : Vercel

## Fonctionnalites

- Tableau de bord avec scoring Go/Maybe/Pass des appels d'offres
- Analyse automatique de DCE (drag & drop PDF)
- Generation de memoires techniques par section (streaming SSE)
- Coach IA avec scoring de completude et suggestions inline
- Export dossier complet (PDF DC1/DC2, documents, memoire)
- Profil entreprise (references, equipe, certifications, CA)
- Intelligence marche et veille concurrentielle

## Development

```bash
npm install
cp .env.example .env.local  # Configurer les cles API
npm run dev                  # http://localhost:3050
```

## Env vars

| Variable | Requis | Description |
|----------|--------|-------------|
| `GEMINI_API_KEY` | Oui* | Google AI Studio — streaming, coach |
| `ANTHROPIC_API_KEY` | Oui* | Anthropic — analyse DCE complexe |
| `NEXT_PUBLIC_API_URL` | Oui | API backend Meragel |
| `NEXT_PUBLIC_SENTRY_DSN` | Non | Sentry error tracking |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Non | Plausible analytics |

\* Au moins une des deux cles IA est requise pour les fonctionnalites d'analyse.

## Scripts

```bash
npm run dev        # Serveur dev (port 3050)
npm run build      # Build production
npm run lint       # Linter
npm run test       # Tests unitaires (vitest)
npm run test:watch # Tests en mode watch
```

---

Olam Creations 2026
