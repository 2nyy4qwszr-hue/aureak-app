---
name: 'patrol'
description: 'Lance les 4 agents de patrouille autonomes (Design Patrol, Bug Crawler, UX Inspector, Feature Scout) et produit un rapport consolidé dans _qa/reports/. Utilisé automatiquement par /morning si les rapports sont vieux.'
---

Tu es le Patrol Coordinator d'Aureak.

Ta mission : lancer les 4 agents de patrouille en séquence, produire leurs rapports, puis synthétiser les findings les plus importants en une liste consolidée prête pour le Morning Brief.

---

## Étape 0 — Vérifier que l'app tourne

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081
```

- Si 200 → continuer
- Si non → noter "app non démarrée" dans le rapport consolidé. Les agents qui nécessitent Playwright seront marqués SKIPPED — lancer l'app avec `cd aureak && npx turbo dev --filter=web` puis relancer `/patrol`.

---

## Étape 1 — Design Patrol

Lire et exécuter intégralement `_agents/prompts/design-patrol.md`.

Produire le rapport : `_qa/reports/{DATE}_design-patrol.md`

Résumé intermédiaire à retenir :
- Nombre de BLOCKER
- Nombre de WARNING
- Les 3 dérives les plus critiques (titre + page + fichier)

---

## Étape 2 — Bug Crawler

Lire et exécuter intégralement `_agents/prompts/bug-crawler.md`.

Produire le rapport : `_qa/reports/{DATE}_bug-crawler.md`

Résumé intermédiaire à retenir :
- Nombre de CRITICAL
- Nombre de HIGH
- Les 3 bugs les plus critiques (message + page + fichier probable)

---

## Étape 3 — UX Inspector

Lire et exécuter intégralement `_agents/prompts/ux-inspector.md`.

Produire le rapport : `_qa/reports/{DATE}_ux-inspector.md`

Résumé intermédiaire à retenir :
- Flux les plus lents (nb clics)
- Les 3 frictions P1/P2 principales
- États manquants critiques

---

## Étape 4 — Feature Scout

Lire et exécuter intégralement `_agents/prompts/feature-scout.md`.

Produire le rapport : `_qa/reports/{DATE}_feature-scout.md`

Résumé intermédiaire à retenir :
- % couverture PRD Phase 1
- Les 3 FRs manquants les plus importants
- Les 2 meilleurs quick wins avec Story Factory call

---

## Étape 5 — Rapport consolidé

Créer `_qa/reports/{DATE}_patrol-consolidated.md` :

```markdown
# Patrol Consolidé — {DATE} {HEURE}

## Statut app : {running / non démarrée}

---

## 🔴 CRITIQUES (action immédiate)

{Liste des BLOCKER design + CRITICAL bugs — max 5 items}
- [{type}] {titre} — {page/fichier} — {impact}

## 🟠 IMPORTANTS (cette semaine)

{Liste HIGH bugs + frictions P1 + FRs Phase 1 manquants — max 5 items}
- [{type}] {titre} — {description courte}

## ✨ OPPORTUNITÉS (quand disponible)

{Quick wins Feature Scout — max 3 items}
- {titre} → story "{Story Factory call}"

---

## Chiffres clés

| Agent | BLOCKER/CRITICAL | WARNING/HIGH | OK |
|-------|-----------------|-------------|-----|
| Design Patrol | {N} | {N} | {N} pages |
| Bug Crawler | {N} | {N} | {N} pages |
| UX Inspector | {N} P1 | {N} P2 | {N} flux |
| Feature Scout | {N} manquants | {N} débloqués | {%} couverture |

---

## Fichiers rapports

- `_qa/reports/{DATE}_design-patrol.md`
- `_qa/reports/{DATE}_bug-crawler.md`
- `_qa/reports/{DATE}_ux-inspector.md`
- `_qa/reports/{DATE}_feature-scout.md`
```

---

## Étape 6 — Mise à jour `_qa/summary.md`

Ajouter une ligne dans le tableau "Dernière patrouille" :

```
| {DATE} | Design: {N} BLOCKER | Bugs: {N} CRITICAL | UX: {N} P1 | Features: {N} manquants |
```

---

## Résumé final à afficher

```
✅ Patrouille terminée — {DATE}

🔴 {N} critiques à traiter
🟠 {N} importants
✨ {N} opportunités

Rapport complet : _qa/reports/{DATE}_patrol-consolidated.md
Lance /morning pour les propositions du jour.
```
