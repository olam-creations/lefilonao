# Le Filon AO — Moteur OSINT B2G

## Vision
**Le premier moteur d'intelligence économique B2G en France.**

Pas juste une veille d'appels d'offres. Une arme stratégique.

---

## Les 5 Couches OSINT

### 1. 📡 VEILLE (Ce qu'on a)
- BOAMP — marchés publics français
- TED Europa — marchés européens
- Sources régionales (TODO)

### 2. 🏆 ATTRIBUTION (Qui gagne?)
**Données sur les marchés attribués:**
- Qui a gagné chaque marché
- À quel prix
- Historique par acheteur
- Taux de renouvellement

**Sources:**
- BOAMP attributions
- Data.gouv.fr (DECP - Données Essentielles Commande Publique)
- Registre des marchés

### 3. 🏛️ INTELLIGENCE ACHETEURS
**Profil complet de chaque acheteur public:**
- Organigramme (qui décide)
- Historique d'achats (derniers 5 ans)
- Budget annuel
- Préférences (fournisseurs récurrents)
- Cycle d'achat (quand ils publient)

**Sources:**
- Annuaire service-public.fr
- LinkedIn (organigrammes)
- Bodacc (nominations)
- Sites institutionnels

### 4. 🎯 ANALYSE CONCURRENCE
**Qui sont vos concurrents sur chaque marché:**
- Entreprises qui répondent aux mêmes AO
- Leur taux de succès
- Leurs forces/faiblesses
- Pricing moyen

**Sources:**
- Attributions croisées
- Societe.com / Pappers
- LinkedIn company pages

### 5. 📊 PRÉDICTIONS IA
**Anticiper les opportunités:**
- Marchés qui vont expirer (renouvellement)
- Patterns saisonniers
- Score de probabilité de victoire
- Recommandation de prix

---

## Architecture Technique

```
┌─────────────────────────────────────────────────────────┐
│                    LE FILON AO                          │
├─────────────────────────────────────────────────────────┤
│  FRONTEND (lefilonao.com)                               │
│  ├── Dashboard OSINT                                    │
│  ├── Fiche Acheteur                                     │
│  ├── Fiche Concurrent                                   │
│  ├── Historique Attributions                            │
│  └── Prédictions & Insights                             │
├─────────────────────────────────────────────────────────┤
│  BACKEND (meragel/excalibur)                            │
│  ├── Scraper Multi-Sources                              │
│  ├── Attribution Tracker                                │
│  ├── Entity Enrichment                                  │
│  ├── AI Scoring Engine                                  │
│  └── Prediction Engine                                  │
├─────────────────────────────────────────────────────────┤
│  DATA LAYER (Supabase)                                  │
│  ├── rfps (appels d'offres)                             │
│  ├── attributions (qui a gagné)                         │
│  ├── buyers (acheteurs publics)                         │
│  ├── competitors (entreprises concurrentes)             │
│  ├── contacts (personnes clés)                          │
│  └── insights (prédictions, tendances)                  │
├─────────────────────────────────────────────────────────┤
│  SOURCES OSINT                                          │
│  ├── BOAMP (AO + Attributions)                          │
│  ├── TED Europa                                         │
│  ├── DECP (data.gouv.fr)                                │
│  ├── Pappers API (entreprises)                          │
│  ├── LinkedIn (organigrammes)                           │
│  └── Service-public.fr                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Sources de Données Gratuites

| Source | Data | API | Coût |
|--------|------|-----|------|
| BOAMP | AO + Attributions | OpenDataSoft | Gratuit |
| DECP | Marchés > 25k€ | data.gouv.fr | Gratuit |
| TED | AO européens | RSS/API | Gratuit |
| Pappers | Entreprises FR | API | Freemium |
| data.gouv.fr | Annuaire SP | CSV | Gratuit |
| Sirene | Entreprises | API | Gratuit |
| LinkedIn | Contacts | Scraping | Risqué |

---

## Roadmap OSINT

### Phase 1: Attribution Data (Semaine 1)
- [ ] Scraper DECP (data.gouv.fr)
- [ ] Lier attributions aux AO
- [ ] Afficher "Gagnant précédent" sur chaque AO
- [ ] Dashboard "Qui gagne dans mon secteur"

### Phase 2: Intelligence Acheteurs (Semaine 2)
- [ ] Base de données acheteurs
- [ ] Historique par acheteur
- [ ] Fiche acheteur détaillée
- [ ] Alertes "Cet acheteur publie souvent"

### Phase 3: Analyse Concurrence (Semaine 3)
- [ ] Identifier concurrents via attributions
- [ ] Profil concurrent
- [ ] "Vous vs Concurrent X" sur chaque AO
- [ ] Market share par secteur

### Phase 4: Prédictions (Mois 2)
- [ ] Marchés qui expirent
- [ ] Patterns saisonniers
- [ ] Score de victoire prédictif
- [ ] Recommandation de pricing

---

## Différenciation vs Concurrence

| Feature | MPFrance | Klekoon | Le Filon AO |
|---------|----------|---------|-------------|
| Veille AO | ✅ | ✅ | ✅ |
| Score IA | ❌ | ❌ | ✅ |
| Attributions | ✅ | ❌ | ✅ (TODO) |
| Fiche Acheteur | Basique | ❌ | ✅ Détaillée |
| Analyse Concurrence | ❌ | ❌ | ✅ UNIQUE |
| Prédictions | ❌ | ❌ | ✅ UNIQUE |
| Prix | 1,200-5,000€ | ~1,500€ | **600€** |

**Notre avantage: L'IA + OSINT complet à prix cassé.**

---

*Généré le 2026-02-08 — Metatron Labs*
