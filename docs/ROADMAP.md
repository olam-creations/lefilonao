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
| Dashboard client | ✅ | ✅ | ❌ TODO |
| Historique | ✅ | ✅ | ❌ TODO |
| Attribution (gagnants) | ✅ | ❌ | ❌ TODO |
| Export Excel/CSV | ✅ | ✅ | ⚠️ Basic |
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
- [ ] **Dashboard minimal** `/dashboard`
  - Liste des AO matchés
  - Score Go/No-Go pour chaque
  - Lien vers BOAMP
- [ ] **Email quotidien** avec les AO du jour
- [ ] Stripe fonctionnel

### 🟠 P1 - Parité concurrence (Semaine 2-3)
- [ ] **TED Europa** - marchés européens
- [ ] **Historique** - voir les AO passés
- [ ] **Filtres avancés** - budget, deadline, région
- [ ] **Export CSV** - télécharger sa liste
- [ ] **Dédoublonnage intelligent**

### 🟡 P2 - Différenciation (Mois 2)
- [ ] **Analyse IA détaillée**
  - Forces de l'entreprise vs exigences AO
  - Concurrence estimée
  - Conseil stratégique
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
| AI Analysis | Gemini API | ✅ |
| Emails | Resend | ⚠️ Config needed |
| Payments | Stripe | ⚠️ Config needed |
| Auth | Supabase Auth | ❌ TODO |

---

## Actions immédiates

1. **Dashboard utilisateur** - page `/dashboard` avec auth
2. **Email quotidien** - cron 8h envoie les nouveaux AO
3. **Stripe live** - paiements fonctionnels
4. **TED integration** - doubler les sources

---

*Généré le 2026-02-08*
