# Le Filon AO - Email Setup

## Resend Configuration

Pour envoyer des emails depuis `alertes@lefilonao.com`:

### 1. Créer un compte Resend
https://resend.com/signup

### 2. Ajouter le domaine lefilonao.com

Dashboard Resend → Domains → Add Domain → `lefilonao.com`

### 3. Configurer les DNS Records

Ajouter ces records sur le registrar (Vercel/Namecheap/etc):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| MX | `lefilonao.com` | `feedback-smtp.eu-west-1.amazonses.com` | 3600 |
| TXT | `lefilonao.com` | `v=spf1 include:amazonses.com ~all` | 3600 |
| TXT | `resend._domainkey.lefilonao.com` | *(fourni par Resend)* | 3600 |
| CNAME | `em.lefilonao.com` | *(fourni par Resend)* | 3600 |

### 4. Récupérer l'API Key

Dashboard Resend → API Keys → Create API Key
- Name: `lefilonao-prod`
- Permission: `Sending access`
- Domain: `lefilonao.com`

### 5. Ajouter sur Vercel Meragel

https://vercel.com/olams-projects-97268fcf/meragel/settings/environment-variables

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | `re_xxxxx...` |

### 6. Tester

```bash
curl -X POST https://meragel.vercel.app/api/excalibur/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","sectors":["IT"]}'
```

---

## Emails envoyés

| Template | From | Sujet |
|----------|------|-------|
| Welcome | alertes@lefilonao.com | 🎯 Bienvenue sur Le Filon AO |
| Cold Outreach | alertes@lefilonao.com | 🎯 AO {sector} {budget} - {issuer} |
| Weekly Digest | alertes@lefilonao.com | 📋 {count} nouveaux AO cette semaine |
| Upsell Analysis | alertes@lefilonao.com | 📊 Analyse complète disponible |

---

*Doc générée le 2026-02-08*
