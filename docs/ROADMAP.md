# Le Filon AO - Roadmap Qualité

## 🎯 Objectif
Égaler ou dépasser MPFrance/Klekoon (1,500-4,000€/an) à 50€/mois.

---

## Concurrence - Ce qu'ils offrent

| Feature | MPFrance | Klekoon | Le Filon AO |
|---------|----------|---------|-------------|
| Profil personnalisé | ✅ | ✅ | ✅ |
| Alertes email | ✅ Daily | ✅ | ✅ Daily |
| BOAMP | ✅ | ✅ | ✅ |
| TED Europa | ✅ | ✅ | ❌ TODO |
| Sources régionales | ✅ | ✅ | ❌ TODO |
| Dédoublonnage | ✅ | ✅ | ⚠️ Basic |
| Dashboard client | ✅ | ✅ | ✅ Cockpit complet |
| Historique | ✅ | ✅ | ❌ TODO |
| Attribution (gagnants) | ✅ | ❌ | ❌ TODO |
| Export Excel/CSV | ✅ | ✅ | ✅ CSV avec filtres |
| Contacts enrichis | ✅ | ❌ | ❌ Future |
| **Score IA Go/No-Go** | ❌ | ❌ | ✅ UNIQUE |
| **Analyse IA détaillée** | ❌ | ❌ | ✅ UNIQUE |
| Prix | 1,200-5,000€/an | ~1,500€/an | **600€/an** |

---

## Notre différenciateur: L'IA

Ce que personne d'autre ne fait:
1. **Score Go/No-Go automatique** (0-100)
2. **Analyse forces/faiblesses** par appel d'offres
3. **Recommandations personnalisées**
4. **Estimation chances de succès**

---

## Roadmap par priorité

### 🔴 P0 - MVP Live (Cette semaine)
- [x] Landing page pro
- [x] Pricing simplifié (50€)
- [x] Inscription + email welcome
- [x] **Dashboard cockpit** `/dashboard`
  - KPIs (pipeline, deadlines, profil, taux reponse)
  - Timeline deadlines horizontale
  - Alertes rapides (docs expires, deadlines urgentes)
  - Filtres avances (recherche, score, region, budget, deadline, tri)
  - Cartes AO redesignees avec countdown J-X et barre de progression
- [ ] **Email quotidien** avec les AO du jour
- [ ] Stripe fonctionnel

### 🟠 P1 - Parité concurrence (Semaine 2-3)
- [ ] **TED Europa** - marchés européens
- [ ] **Historique** - voir les AO passés
- [x] **Filtres avancés** - recherche, score, budget, deadline, région, tri (6 dimensions)
- [x] **Export CSV** - export filtre avec protection injection formules
- [ ] **Dédoublonnage intelligent**

### 🟡 P2 - Différenciation (Mois 2)
- [x] **Analyse IA détaillée**
  - Analyse DCE avec upload PDF (Anthropic Claude)
  - Coach IA avec suggestions inline (Gemini)
  - Génération mémoire technique par section (streaming SSE)
  - Score de complétude et recommandations stratégiques
- [ ] **Attribution data** - qui a gagné les AO passés
- [ ] **Mémorisation profil** - apprend des AO gagnés

### 🟢 P3 - Premium (Mois 3+)
- [ ] **Sources régionales** (AWS, Maximilien, etc.)
- [ ] **Contacts enrichis** - email/tel des acheteurs
- [ ] **API** pour intégration CRM
- [ ] **Multi-utilisateurs**

---

## Stack technique

| Composant | Tech | Status |
|-----------|------|--------|
| Frontend public | Next.js (lefilonao.com) | ✅ |
| Backend/API | Next.js (meragel) | ✅ |
| Database | Supabase | ✅ |
| Scraping | BOAMP OpenDataSoft | ✅ |
| AI Analysis | Gemini + Anthropic (dual) | ✅ |
| Emails | Resend | ⚠️ Config needed |
| Payments | Stripe | ⚠️ Config needed |
| Auth | Supabase Auth | ❌ TODO |

---

## Actions immédiates

1. ~~**Dashboard utilisateur**~~ ✅ Cockpit complet avec KPIs, timeline, filtres
2. **Email quotidien** - cron 8h envoie les nouveaux AO
3. **Stripe live** - paiements fonctionnels
4. **TED integration** - doubler les sources
5. **Tests E2E** - parcours critiques (login, dashboard, detail AO)

---

*Mis à jour le 2026-02-09*
