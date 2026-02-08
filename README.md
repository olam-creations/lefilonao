# Excalibur Web

Public frontend for Excalibur RFP Alert Service.

## Status

Awaiting domain name decision.

## Stack

- Next.js 15 + React 19
- Tailwind CSS 4
- Vercel deployment

## Pages

- `/` - Landing page
- `/subscribe` - Multi-step signup form
- `/pricing` - Plans comparison

## API

Connects to Meragel internal API:
```
POST /api/excalibur/subscribe
GET  /api/excalibur/plans
```

## Domain Candidates

- vigie-ao.fr
- filon-ao.fr
- gomarche.fr
- veillego.fr

## Development

```bash
npm install
npm run dev  # Port 3050
```

---

Part of Metatron Labs.
