# Projection Financiere - Le Filon AO

> Derniere mise a jour : 9 fevrier 2026

## Modele tarifaire

| Plan | Prix | Conditions |
|------|------|------------|
| Gratuit | 0 EUR/mois | 5 AO/mois, digest hebdo |
| **Pro** | **50 EUR TTC/mois** | Illimite, scoring IA, analyse DCE, intelligence marche |
| **Fondateur** | **25 EUR TTC/mois** | 6 mois, puis 40 EUR/mois a vie (-20% vs normal) |

- 50 places fondateur disponibles
- Tous prix TTC (TVA 20%)

---

## Couts mensuels fixes

| Service | Cout/mois | Annuel |
|---------|-----------|--------|
| Vercel (hosting) | 20 EUR | 240 EUR |
| Supabase (database) | 20 EUR | 240 EUR |
| Sentry (monitoring) | 29 EUR | 348 EUR |
| Plausible (analytics) | 7.50 EUR | 90 EUR |
| LegalPlace (domiciliation) | 25 EUR | 300 EUR |
| Resend (emails) | 20 EUR | 240 EUR |
| GitHub (repos) | 5 EUR | 60 EUR |
| Cloudflare (CDN/Workers) | 5 EUR | 60 EUR |
| Claude Code (dev) | 200 EUR | 2 400 EUR |
| **TOTAL** | **331.50 EUR** | **3 978 EUR** |

### Seuils de rentabilite

| Scenario | Utilisateurs necessaires |
|----------|--------------------------|
| Fondateurs seuls (25 EUR) | **14 fondateurs** = 350 EUR > 331.50 EUR |
| Reguliers seuls (50 EUR) | **7 reguliers** = 350 EUR > 331.50 EUR |
| Mix (30 F + 5 R) | 30x25 + 5x50 = **1 000 EUR** (marge 668 EUR) |

---

## Scenario Pessimiste

**Hypotheses :** remplissage lent, faible traction organique, churn 7%

- Fondateurs pleins en M8
- 8 reguliers a M12
- Churn mensuel : 7%

| Mois | F @25EUR | F @40EUR | R @50EUR | MRR | Couts | Resultat |
|------|---------|---------|---------|-----|-------|----------|
| M1 | 5 | 0 | 0 | 125 | 332 | -207 |
| M2 | 12 | 0 | 0 | 300 | 332 | -32 |
| M3 | 18 | 0 | 0 | 450 | 332 | **+118** |
| M4 | 24 | 0 | 0 | 600 | 332 | +268 |
| M5 | 30 | 0 | 0 | 750 | 332 | +418 |
| M6 | 38 | 0 | 0 | 950 | 332 | +618 |
| M7 | 33 | 5 | 1 | 1 075 | 332 | +743 |
| M8 | 28 | 10 | 2 | 1 200 | 332 | +868 |
| M9 | 15 | 22 | 3 | 1 405 | 332 | +1 073 |
| M10 | 8 | 26 | 4 | 1 440 | 332 | +1 108 |
| M11 | 3 | 28 | 5 | 1 445 | 332 | +1 113 |
| M12 | 0 | 30 | 6 | 1 500 | 332 | +1 168 |

| Metrique | Valeur |
|----------|--------|
| **Revenue cumule Y1** | **~11 000 EUR** |
| **Couts cumules Y1** | **~3 978 EUR** |
| **Resultat net Y1** | **~+7 000 EUR** |
| **MRR sortie M12** | **1 500 EUR** |
| **ARR M12** | **18 000 EUR** |
| **Break-even** | **M3** |

---

## Scenario Modere

**Hypotheses :** bon product-market fit, LinkedIn + bouche-a-oreille, churn 5%

- Fondateurs pleins en M5
- 25 reguliers a M12
- Churn mensuel : 5%

| Mois | F @25EUR | F @40EUR | R @50EUR | MRR | Couts | Resultat |
|------|---------|---------|---------|-----|-------|----------|
| M1 | 10 | 0 | 0 | 250 | 332 | -82 |
| M2 | 22 | 0 | 0 | 550 | 332 | +218 |
| M3 | 33 | 0 | 0 | 825 | 332 | +493 |
| M4 | 42 | 0 | 0 | 1 050 | 332 | +718 |
| M5 | 48 | 0 | 2 | 1 300 | 332 | +968 |
| M6 | 43 | 5 | 5 | 1 525 | 332 | +1 193 |
| M7 | 33 | 12 | 8 | 1 705 | 332 | +1 373 |
| M8 | 20 | 22 | 11 | 1 930 | 332 | +1 598 |
| M9 | 8 | 30 | 14 | 2 100 | 332 | +1 768 |
| M10 | 0 | 38 | 16 | 2 320 | 332 | +1 988 |
| M11 | 0 | 37 | 18 | 2 380 | 332 | +2 048 |
| M12 | 0 | 36 | 20 | 2 440 | 332 | +2 108 |

| Metrique | Valeur |
|----------|--------|
| **Revenue cumule Y1** | **~18 500 EUR** |
| **Couts cumules Y1** | **~3 978 EUR** |
| **Resultat net Y1** | **~+14 500 EUR** |
| **MRR sortie M12** | **2 440 EUR** |
| **ARR M12** | **29 280 EUR** |
| **Break-even** | **M2** |

---

## Scenario Optimiste

**Hypotheses :** lancement viral, niche bien ciblee, churn 3%

- Fondateurs pleins en M3
- 50 reguliers a M12
- Churn mensuel : 3%

| Mois | F @25EUR | F @40EUR | R @50EUR | MRR | Couts | Resultat |
|------|---------|---------|---------|-----|-------|----------|
| M1 | 18 | 0 | 0 | 450 | 332 | +118 |
| M2 | 35 | 0 | 0 | 875 | 332 | +543 |
| M3 | 49 | 0 | 2 | 1 325 | 332 | +993 |
| M4 | 48 | 0 | 6 | 1 500 | 332 | +1 168 |
| M5 | 47 | 0 | 10 | 1 675 | 332 | +1 343 |
| M6 | 46 | 0 | 15 | 1 900 | 332 | +1 568 |
| M7 | 30 | 17 | 20 | 2 430 | 332 | +2 098 |
| M8 | 15 | 30 | 26 | 2 875 | 332 | +2 543 |
| M9 | 0 | 44 | 32 | 3 360 | 332 | +3 028 |
| M10 | 0 | 43 | 36 | 3 520 | 332 | +3 188 |
| M11 | 0 | 42 | 40 | 3 680 | 332 | +3 348 |
| M12 | 0 | 41 | 44 | 3 840 | 332 | +3 508 |

| Metrique | Valeur |
|----------|--------|
| **Revenue cumule Y1** | **~28 000 EUR** |
| **Couts cumules Y1** | **~3 978 EUR** |
| **Resultat net Y1** | **~+24 000 EUR** |
| **MRR sortie M12** | **3 840 EUR** |
| **ARR M12** | **46 080 EUR** |
| **Break-even** | **M1** |

---

## Comparaison des 3 scenarios

| Metrique | Pessimiste | Modere | Optimiste |
|----------|------------|--------|-----------|
| Break-even | M3 | M2 | M1 |
| MRR M6 | 950 EUR | 1 525 EUR | 1 900 EUR |
| MRR M12 | 1 500 EUR | 2 440 EUR | 3 840 EUR |
| Revenue Y1 | 11 000 EUR | 18 500 EUR | 28 000 EUR |
| Resultat net Y1 | +7 000 EUR | +14 500 EUR | +24 000 EUR |
| ARR M12 | 18 000 EUR | 29 280 EUR | 46 080 EUR |
| Clients actifs M12 | 36 | 56 | 85 |

---

## Projection Annee 2

A M12, tous les fondateurs sont deja a 40 EUR (transition rolling terminee entre M7-M11).
La croissance Y2 vient uniquement des reguliers a 50 EUR.

### Scenario modere Y2

| Hypothese | Valeur |
|-----------|--------|
| Fondateurs actifs (churn 5%) | ~34 a 40 EUR |
| Nouveaux reguliers | +8/mois |
| Churn reguliers | 5%/mois |

| Metrique | M18 | M24 |
|----------|-----|-----|
| Fondateurs @40 EUR | 30 | 26 |
| Reguliers @50 EUR | 45 | 65 |
| **MRR** | **3 450 EUR** | **4 290 EUR** |
| **ARR** | **41 400 EUR** | **51 480 EUR** |

---

## Analyse de sensibilite

### Impact du churn

| Churn mensuel | Clients actifs M12 (modere) | MRR M12 |
|---------------|----------------------------|---------|
| 3% | 66 | 2 900 EUR |
| **5% (base)** | **56** | **2 440 EUR** |
| 7% | 48 | 2 050 EUR |
| 10% | 38 | 1 600 EUR |

### Impact du prix fondateur

| Prix fondateur | Revenue Y1 (modere) | Perte vs 50 EUR |
|----------------|---------------------|-----------------|
| 25 EUR (6 mois) | 18 500 EUR | -3 200 EUR |
| 50 EUR (pas d'offre) | 21 700 EUR | reference |

**Le cout de l'offre fondateur est ~3 200 EUR en revenue Y1, mais elle accelere l'acquisition de 2-3 mois.** L'investissement est recupere des M10 quand les fondateurs passent a 40 EUR.

---

## Points cles

1. **Break-even rapide** : meme en pessimiste, les couts sont couverts des M3 (14 fondateurs)
2. **Marge operationnelle elevee** : SaaS pur = 70-85% de marge nette apres couts infra
3. **Transition rolling** : pas de cliff de revenue, les fondateurs basculent progressivement M7-M11
4. **40 EUR fondateur post-6 mois** : toujours -20% vs normal = argument de retention fort
5. **Claude Code = 60% des couts** : a reduire si possible (batch work, sessions plus courtes)
6. **Risque principal** : churn. Chaque point de churn = ~400 EUR MRR perdu a M12

---

## Actions recommandees

- [ ] Mettre en place Stripe avec les 2 price points (50 EUR normal, 25 EUR fondateur)
- [ ] Configurer la logique de transition automatique 25 EUR -> 40 EUR apres 6 mois
- [ ] Tracker le nombre de places fondateur restantes (afficher sur pricing page)
- [ ] Mettre en place le suivi MRR/churn dans un dashboard admin
- [ ] Reduire Claude Code a 100 EUR/mois si possible (gain 1 200 EUR/an)
- [ ] Objectif M3 : 30 fondateurs (750 EUR MRR, 2.3x break-even)
