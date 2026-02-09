# PRD: Score Transparent + Honest Mode

> Expliquer chaque score, detecter les marches verrouilles, gagner la confiance

## Probleme

L'utilisateur voit "Score 78 - GO" mais ne comprend pas pourquoi. Il ne sait pas sur quels criteres l'IA s'est basee, ni comment ameliorer sa candidature. Pire : certains AO semblent ouverts mais sont en realite "verrouilles" (meme gagnant depuis 5 ans), et l'utilisateur perd du temps a y repondre.

## Objectif

1. Rendre chaque score explicable : decomposition par critere, points forts/faibles
2. Detecter et signaler les marches potentiellement verrouilles (donnees DECP)
3. Permettre a l'utilisateur de ponderer ses propres criteres

## Non-objectifs

- Pas de modification de l'algorithme de scoring (juste l'affichage)
- Pas de garantie sur la detection verrouillage (indicateurs, pas certitudes)
- Pas de scoring en temps reel (reste batch quotidien)

---

## Solution

### Score decompose (5 axes)

Le score actuel Go/No-Go est decompose en 5 sous-scores visibles :

| Axe | Ce qu'il mesure | Icone |
|-----|----------------|-------|
| **Alignement** | Correspondance secteur/competences avec l'AO | Target |
| **Eligibilite** | Criteres administratifs (taille, certifications, zone) | Shield |
| **Budget** | Adequation budget estime vs capacite de l'entreprise | Coins |
| **Concurrence** | Intensite concurrentielle estimee (donnees DECP) | Users |
| **Timing** | Delai restant vs temps de preparation necessaire | Clock |

### Affichage

Sur la carte AO et la page detail :

```
Score global : 78/100 — GO

  Alignement    ████████░░  85
  Eligibilite   ███████░░░  72
  Budget        █████████░  90
  Concurrence   ██████░░░░  65
  Timing        ████████░░  78

Points forts : Secteur exact, budget accessible
Points faibles : 4 concurrents recurrents sur cet acheteur
Conseil IA : "Mettez en avant vos references locales (region Ile-de-France)"
```

### Honest Mode — Detection verrouillage

Badge sur les AO ou l'analyse DECP montre :
- Meme titulaire depuis >= 3 renouvellements consecutifs
- 1 seule offre recue sur les marches precedents de cet acheteur
- Taux de loyaute acheteur-titulaire > 80%

| Signal | Badge | Message |
|--------|-------|---------|
| Renouvellement recurrent (meme gagnant 3x+) | Orange "Marche recurrent" | "Ce marche a ete attribue a [X] les 3 dernieres fois" |
| Faible concurrence (< 2 offres en moyenne) | Rouge "Concurrence faible" | "En moyenne 1.5 offres recues — marche potentiellement fleche" |
| Loyaute forte (> 80%) | Orange "Relation etablie" | "L'acheteur attribue 85% de ses marches au meme titulaire" |
| Aucun signal | Vert "Marche ouvert" | "Aucun signal de verrouillage detecte" |

### Ponderation personnalisee

L'utilisateur peut ajuster l'importance de chaque axe :

```
Vos priorites (total = 100%) :
  Alignement    [===== 25%]  (slider)
  Eligibilite   [==== 20%]
  Budget        [===== 25%]
  Concurrence   [=== 15%]
  Timing        [=== 15%]
```

Le score global est recalcule en temps reel selon sa ponderation.

---

## Architecture technique

### Donnees

Pas de nouvelle table necessaire. On enrichit la reponse API existante.

Le scoring decompose est calcule cote API (pas cote client) :
- `/api/ao/[id]` retourne `scoreBreakdown: { alignment, eligibility, budget, competition, timing }`
- `/api/ao/[id]` retourne `lockSignals: { isRecurrent, avgOffers, loyaltyPct, signals[] }`

Les ponderations sont stockees dans localStorage (profil utilisateur) :
```typescript
interface ScoreWeights {
  alignment: number;    // 0-100, default 20
  eligibility: number;  // 0-100, default 20
  budget: number;       // 0-100, default 20
  competition: number;  // 0-100, default 20
  timing: number;       // 0-100, default 20
}
```

### Detection verrouillage

Query DECP existante enrichie :
```sql
-- Pour un acheteur donne, verifier recurrence
SELECT winner_name, COUNT(*) as wins
FROM decp_attributions
WHERE buyer_name = $1 AND cpv_division = $2
GROUP BY winner_name
ORDER BY wins DESC
LIMIT 5;
```

Compare avec le marche courant (meme acheteur + meme CPV).

### Composants UI

| Composant | Description | ~Lignes |
|-----------|-------------|---------|
| `ScoreBreakdown.tsx` | 5 barres horizontales + points forts/faibles | 120 |
| `LockSignalBadge.tsx` | Badge verrouillage avec tooltip explicatif | 50 |
| `ScoreWeightsEditor.tsx` | 5 sliders pour ponderation perso | 80 |
| `AiAdvice.tsx` | Conseil contextuel de l'IA | 40 |

### Integration

- Page detail AO : remplacer le badge score simple par `ScoreBreakdown`
- Carte AO dashboard : ajouter `LockSignalBadge` a cote du score
- Page profil : ajouter `ScoreWeightsEditor`

---

## Metriques de succes

| Metrique | Cible M+1 | Cible M+3 |
|----------|-----------|-----------|
| % users qui cliquent "voir le detail du score" | 40% | 60% |
| % users qui ajustent leurs ponderations | 10% | 25% |
| Reduction du taux de reponse sur AO verrouilles | -15% | -30% |
| NPS amelioration (confiance dans les scores) | +5 | +15 |

---

## Phases

| Phase | Scope | Effort |
|-------|-------|--------|
| **P1** | Score decompose (5 axes) + affichage barres | 4 jours |
| **P2** | Detection verrouillage (badges + tooltips) | 3 jours |
| **P3** | Conseil IA contextuel | 2 jours |
| **P4** | Ponderation personnalisee (sliders) | 3 jours |

**Total : ~12 jours**

---

## Argument marketing

> "Le Filon AO est le seul outil qui vous dit POURQUOI repondre — et surtout, QUAND NE PAS repondre.
> Score transparent, detection de marches verrouilles, conseil personnalise.
> Arretez de perdre du temps sur des AO perdus d'avance."
