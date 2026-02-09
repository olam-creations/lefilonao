# PRD: Watchlist Acheteurs + Alertes Intelligentes

> Surveiller ses acheteurs cibles, ne jamais rater une publication

## Probleme

Les utilisateurs connaissent deja les acheteurs avec qui ils veulent travailler (collectivites locales, hopitaux, ministeres). Aujourd'hui, ils doivent scanner manuellement le BOAMP ou esperer que l'alerte par secteur les attrape. Ils veulent etre notifies DES QU'un acheteur cible publie.

## Objectif

Permettre aux users Pro de creer une watchlist d'acheteurs et de recevoir une notification instantanee quand un acheteur surveille publie un nouvel AO.

## Non-objectifs

- Pas de scraping supplementaire (on utilise les donnees BOAMP existantes)
- Pas de CRM acheteur complet (juste watchlist + alertes)
- Pas de matching auto acheteur-profil (c'est l'utilisateur qui choisit)

---

## Solution

### Watchlist

L'utilisateur peut ajouter un acheteur a sa watchlist depuis :
- La fiche acheteur (page Market Intelligence, EntitySheet)
- La page detail d'un AO (clic sur le nom de l'acheteur)
- Recherche manuelle par nom/SIRET

### Ecran Watchlist

Route : `/dashboard/watchlist`

| Element | Description |
|---------|-------------|
| Liste des acheteurs surveilles | Nom, derniere publication, nb AO total, nb AO actifs |
| Badge activite | Vert (publie recemment), gris (inactif > 30j) |
| Bouton "Retirer" | Supprimer de la watchlist |
| Stats resume | "X acheteurs surveilles, Y AO actifs, Z dans votre secteur" |

### Alertes

| Type | Canal | Condition |
|------|-------|-----------|
| Nouvel AO d'un acheteur watchliste | Email + in-app | Publication detectee dans le scan quotidien |
| AO d'un watchliste avec score >= 80 | Email prioritaire | High match + acheteur cible = signal fort |
| Recap hebdo watchlist | Email digest | Tous les AO de la semaine de tes acheteurs |

### Enrichissement fiche acheteur

La fiche acheteur (deja dans EntitySheet) est enrichie avec :
- Frequence de publication (mensuel, trimestriel, annuel)
- Secteurs CPV principaux
- Budget moyen des marches
- Taux de renouvellement
- Bouton "Surveiller cet acheteur"

---

## Architecture technique

### Donnees

```sql
CREATE TABLE user_watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_siret TEXT,
  added_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_watchlist_unique ON user_watchlist (user_email, buyer_name);
CREATE INDEX idx_watchlist_user ON user_watchlist (user_email);
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/watchlist` | GET | Liste watchlist de l'user |
| `/api/watchlist` | POST | Ajouter un acheteur |
| `/api/watchlist/[id]` | DELETE | Retirer un acheteur |
| `/api/watchlist/alerts` | GET | AO recents des acheteurs watchlistes |

### Logique d'alerte

Dans le Worker DECP existant (`syncDecp`), apres insertion des nouveaux AO :
1. Query `user_watchlist` pour trouver les users qui surveillent cet acheteur
2. Enqueue un email via Resend pour chaque match
3. Stocker la notification in-app

### Composants UI

| Composant | Description | ~Lignes |
|-----------|-------------|---------|
| `WatchlistPage.tsx` | Page avec liste acheteurs + stats | 120 |
| `WatchButton.tsx` | Bouton toggle "Surveiller" (coeur/cloche) | 40 |
| `WatchlistAlerts.tsx` | Feed des derniers AO des acheteurs watchlistes | 80 |

---

## Metriques de succes

| Metrique | Cible M+1 | Cible M+3 |
|----------|-----------|-----------|
| % users Pro avec >= 1 acheteur watchliste | 40% | 70% |
| Acheteurs moyens par watchlist | 3 | 8 |
| Taux d'ouverture emails watchlist | 50% | 55% |
| AO qualifies via watchlist | 10% du total | 25% |

---

## Phases

| Phase | Scope | Effort |
|-------|-------|--------|
| **P1** | CRUD watchlist + bouton "Surveiller" | 3 jours |
| **P2** | Page watchlist + feed AO recents | 3 jours |
| **P3** | Alertes email (Resend) quand AO detecte | 2 jours |
| **P4** | Badge in-app + enrichissement fiche acheteur | 2 jours |

**Total : ~10 jours**
