---
name: 'patrol'
description: 'Lance les 4 agents de patrouille en parallèle et produit un rapport consolidé dans _qa/reports/. Utilisé automatiquement par /morning si les rapports sont vieux.'
---

Tu es le Patrol Coordinator d'Aureak.

Ta mission : lancer les 4 agents en parallèle, collecter leurs résultats, produire le rapport consolidé.

---

## Étape 0 — Vérifier app + Playwright MCP

```bash
APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081)
```

Puis tester Playwright MCP :
```
mcp__playwright__browser_navigate → url: "about:blank"
```
- Si succès → `PLAYWRIGHT_STATUS=ready` → `mcp__playwright__browser_close`
- Si erreur/timeout → `PLAYWRIGHT_STATUS=unavailable`

Résultat :
- Si `APP_STATUS=200` ET `PLAYWRIGHT_STATUS=ready` → mode complet (screenshots + console check)
- Si `APP_STATUS=200` ET `PLAYWRIGHT_STATUS=unavailable` → mode statique (analyse de code uniquement)
- Si `APP_STATUS != 200` → mode statique. Les agents visuels marqueront SKIPPED.

Passer `APP_STATUS` et `PLAYWRIGHT_STATUS` à chaque agent.

---

## Étape 1 — Lancer les 4 agents en parallèle

Spawner les 4 sous-agents **simultanément** (un message avec 4 Agent tool calls) :

**Agent 1 — Design Patrol**
```
Lis et exécute `_agents/prompts/design-patrol.md`. APP_STATUS={APP_STATUS}. PLAYWRIGHT_STATUS={PLAYWRIGHT_STATUS}.
Produis le rapport : `_qa/reports/{DATE}_design-patrol.md`
Retourne UNIQUEMENT ce bloc structuré :
nb_blocker:{N} | nb_warning:{N} | top3:["{type} — {titre} — {page}:{fichier}", ...]
```

**Agent 2 — Bug Crawler**
```
Lis et exécute `_agents/prompts/bug-crawler.md`. APP_STATUS={APP_STATUS}. PLAYWRIGHT_STATUS={PLAYWRIGHT_STATUS}.
Produis le rapport : `_qa/reports/{DATE}_bug-crawler.md`
Retourne UNIQUEMENT :
nb_critical:{N} | nb_high:{N} | top3:["{titre} — {page}:{fichier}", ...]
```

**Agent 3 — UX Inspector**
```
Lis et exécute `_agents/prompts/ux-inspector.md`. APP_STATUS={APP_STATUS}. PLAYWRIGHT_STATUS={PLAYWRIGHT_STATUS}.
Produis le rapport : `_qa/reports/{DATE}_ux-inspector.md`
Retourne UNIQUEMENT :
nb_p1:{N} | nb_p2:{N} | top3:["{friction} — {route}", ...]
```

**Agent 4 — Feature Scout**
```
Lis et exécute `_agents/prompts/feature-scout.md`.
Produis le rapport : `_qa/reports/{DATE}_feature-scout.md`
Retourne UNIQUEMENT :
pct_couverture:{N}% | nb_manquants:{N} | top3:["{FR} → {story_factory_call}", ...]
```

Attendre la fin des 4 agents avant de continuer.

---

## Étape 2 — Delta avec la patrol précédente

```bash
# Trouver les 2 rapports consolidés les plus récents
ls -t _qa/reports/*patrol-consolidated* 2>/dev/null | head -2
```

Si un rapport précédent existe → le lire et comparer avec les résultats actuels :
- **Nouveaux problèmes** : items dans les top3 actuels absents du précédent → marquer `🆕`
- **Problèmes résolus** : items dans le précédent absents des résultats actuels → marquer `✅ résolu`
- **Problèmes qui empirent** : même item mais sévérité montée (WARNING→BLOCKER, P2→P1) → marquer `↗ aggravé`

Si aucun rapport précédent → skip le delta.

---

## Étape 3 — Rapport consolidé

Créer `_qa/reports/{DATE}_patrol-consolidated.md` à partir des 4 retours :

```markdown
# Patrol Consolidé — {DATE} {HEURE}

## Statut app : {running / non-démarrée}

---

## 🔴 CRITIQUES (action immédiate)

{BLOCKER design + CRITICAL bugs — max 5}
- [{type}] {titre} — {page/fichier} — {impact}

## 🟠 IMPORTANTS (cette semaine)

{HIGH bugs + frictions P1 + FRs Phase 1 manquants — max 5}
- [{type}] {titre} — {description courte}

## ✨ OPPORTUNITÉS (quand disponible)

{Quick wins Feature Scout — max 3}
- {titre} → "{story_factory_call}"

## 📊 Évolution (delta vs patrol précédente)

{Si delta disponible :}
- 🆕 {N} nouveaux problèmes : {titres}
- ✅ {N} résolus : {titres}
- ↗ {N} aggravés : {titres}

{Si pas de patrol précédente : "Première patrol — pas de delta disponible."}

---

## Chiffres clés

| Agent | BLOCKER/CRITICAL | WARNING/HIGH | OK |
|-------|-----------------|-------------|-----|
| Design Patrol | {N} | {N} | — |
| Bug Crawler | {N} | {N} | — |
| UX Inspector | {N} P1 | {N} P2 | — |
| Feature Scout | {N} manquants | — | {%} couverture |

---

## Fichiers rapports

- `_qa/reports/{DATE}_design-patrol.md`
- `_qa/reports/{DATE}_bug-crawler.md`
- `_qa/reports/{DATE}_ux-inspector.md`
- `_qa/reports/{DATE}_feature-scout.md`
```

---

## Étape 4 — Mise à jour `_qa/summary.md`

Ajouter une ligne dans le tableau "Dernière patrouille" :

```
| {DATE} | Design: {N} BLOCKER | Bugs: {N} CRITICAL | UX: {N} P1 | Features: {N} manquants |
```

---

## Résumé final à afficher

```
✅ Patrouille terminée — {DATE}

🔴 {N} critiques
🟠 {N} importants
✨ {N} opportunités

Rapport : _qa/reports/{DATE}_patrol-consolidated.md
```
