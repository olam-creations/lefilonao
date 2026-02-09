# PRD: Pipeline Kanban + Workflows Automatises

> Le pivot de "outil de veille" vers "outil de gestion AO complet"

## Probleme

Les utilisateurs detectent des AO avec Le Filon, mais gerent leur processus de reponse dans des tableurs, emails ou de tete. Ils n'ont aucune vue d'ensemble de leurs candidatures en cours, aucun rappel automatique, et perdent des AO par oubli de deadline.

## Objectif

Transformer Le Filon AO en CRM des marches publics : un pipeline visuel ou chaque AO avance de la detection a la soumission, avec des automatisations a chaque etape.

## Non-objectifs

- Pas de collaboration multi-utilisateurs (Tier 2 separe)
- Pas de soumission electronique directe sur les plateformes AO
- Pas de gestion financiere (devis, facturation)

---

## Solution

### Pipeline Kanban (6 colonnes)

```
Detecte → Qualifie → DCE Analyse → Redaction → Soumis → Resultat
```

| Colonne | Entree | Sortie | Automatisation |
|---------|--------|--------|----------------|
| **Detecte** | AO matche le profil | User clique "Qualifier" ou "Passer" | Auto : alerte email |
| **Qualifie** | User confirme interet | User lance analyse DCE | Auto : score Go/No-Go affiche |
| **DCE Analyse** | DCE uploade et analyse par IA | User demarre redaction | Auto : extraction criteres, checklist |
| **Redaction** | Memoire en cours | User marque "Soumis" | Auto : rappel deadline J-7, J-3, J-1 |
| **Soumis** | Reponse envoyee | Resultat connu | Auto : suivi date attribution |
| **Resultat** | Gagne / Perdu / Sans suite | Archive | Auto : analytics win/loss |

### Carte AO (dans le Kanban)

Chaque carte affiche :
- Titre + acheteur
- Score Go/No-Go (badge couleur)
- Budget estime
- Deadline (avec countdown rouge si < 7j)
- Tags personnalises
- Progress bar (etapes completees)

### Drag & Drop

- Deplacer une carte entre colonnes
- Reordonner dans une colonne (priorite)
- Click pour ouvrir le detail complet

### Workflows automatises

| Trigger | Action |
|---------|--------|
| AO detecte avec score >= 80 | Notif email + push dans "Qualifie" auto |
| AO passe en "DCE Analyse" | Lancer analyse DCE IA automatiquement |
| Deadline dans 7 jours | Email rappel + badge rouge sur la carte |
| Deadline dans 3 jours | Email urgence |
| AO passe en "Soumis" | Programmer suivi resultat |
| Resultat publie (BOAMP) | Notif + deplacement auto dans "Resultat" |

---

## Architecture technique

### Donnees

Table Supabase `ao_pipeline` :
```sql
CREATE TABLE ao_pipeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  ao_id TEXT NOT NULL,
  ao_title TEXT NOT NULL,
  ao_issuer TEXT,
  ao_budget TEXT,
  ao_deadline TIMESTAMPTZ,
  ao_score INTEGER,
  ao_score_label TEXT,
  stage TEXT NOT NULL DEFAULT 'detected',
  position INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pipeline_user ON ao_pipeline (user_email, stage);
```

Stages enum : `detected`, `qualified`, `dce_analyzed`, `drafting`, `submitted`, `result`

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/pipeline` | GET | Liste des AO dans le pipeline (par stage) |
| `/api/pipeline` | POST | Ajouter un AO au pipeline |
| `/api/pipeline/[id]` | PATCH | Changer stage, position, tags, notes |
| `/api/pipeline/[id]` | DELETE | Retirer du pipeline |
| `/api/pipeline/stats` | GET | Compteurs par stage + funnel |

### Composants UI

| Composant | Description | ~Lignes |
|-----------|-------------|---------|
| `PipelineBoard.tsx` | Board Kanban avec 6 colonnes, drag & drop | 200 |
| `PipelineColumn.tsx` | Colonne individuelle avec header + compteur | 80 |
| `PipelineCard.tsx` | Carte AO draggable | 100 |
| `PipelineFilters.tsx` | Filtres (tags, deadline, score) | 60 |
| `PipelineStats.tsx` | Mini funnel en haut (compteurs par stage) | 50 |
| `AddToPipelineButton.tsx` | Bouton "Ajouter au pipeline" sur chaque AO | 30 |

### Drag & Drop

Utiliser `@dnd-kit/core` + `@dnd-kit/sortable` (deja standard React, leger, accessible).

### Page

Nouvelle route : `/dashboard/pipeline`
Ajouter onglet dans la navigation dashboard.

---

## Metriques de succes

| Metrique | Cible M+1 | Cible M+3 |
|----------|-----------|-----------|
| % users Pro utilisant le pipeline | 30% | 60% |
| AO moyen par pipeline | 5 | 12 |
| Taux de passage Detecte > Soumis | 15% | 25% |
| Reduction churn Pro | -10% | -25% |

---

## Phases d'implementation

| Phase | Scope | Effort |
|-------|-------|--------|
| **P1** | Board statique (6 colonnes, drag & drop, CRUD) | 1 semaine |
| **P2** | Bouton "Ajouter au pipeline" sur les AO existants | 2 jours |
| **P3** | Workflows auto (rappels deadline, score auto-qualify) | 1 semaine |
| **P4** | Stats funnel + analytics | 3 jours |

**Total : ~3 semaines**
