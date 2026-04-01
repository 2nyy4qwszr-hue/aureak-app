# LAUNCH — Démarrage Rapide des Agents

## V2 — Script automatique (recommandé)

Le script lit le `git diff` et génère le bloc pré-rempli dans le clipboard.

```bash
qa scope 20-1    # début de story → crée le fichier scope
qa gate1 20-1    # après implémentation → génère + copie dans clipboard
qa gate2 20-1    # avant deploy → génère + copie dans clipboard
```

Setup unique (ajouter dans `~/.zshrc`) :
```bash
alias qa="/Users/jeremydevriendt/Documents/Claude-projets/Application\ Aureak/_agents/scripts/qa.sh"
```

---

## V1 — Blocs manuels (fallback)

> Copier le bloc correspondant dans Claude Code. Remplacer uniquement les lignes marquées `← MODIFIER`.

---

## GATE 1 — Pré-PR

### Agent 1 · Code Reviewer (toujours)

```
Lis le fichier `_agents/prompts/code-reviewer.md` pour les instructions complètes.

Story analysée : story-{XX-Y}                                    ← MODIFIER
Story path : _bmad-output/implementation-artifacts/story-{XX-Y}.md  ← MODIFIER

Fichiers modifiés :
- {fichier1}                                                      ← MODIFIER
- {fichier2}
- {fichier3}

Lis d'abord la story, puis analyse chaque fichier.
Produis le rapport dans : _qa/reports/{DATE}_story-{XX-Y}_code-review.md
```

---

### Agent 2 · Security Auditor (si auth / RLS / données sensibles / nouvelle table)

```
Lis le fichier `_agents/prompts/security-auditor.md` pour les instructions complètes.

Story analysée : story-{XX-Y}                                    ← MODIFIER

Fichiers à analyser (migrations, edge functions, api-client) :
- {fichier1}                                                      ← MODIFIER
- {fichier2}

Produis le rapport dans : _qa/reports/{DATE}_story-{XX-Y}_security.md
```

---

### Agent 3 · Migration Validator (si nouveau fichier .sql)

```
Lis le fichier `_agents/prompts/migration-validator.md` pour les instructions complètes.

Migration à valider : supabase/migrations/{000XX_nom.sql}         ← MODIFIER
Story associée : story-{XX-Y}                                     ← MODIFIER

Lis toutes les migrations précédentes pour le contexte.
Compare avec packages/types/src/entities.ts et enums.ts.
Produis le rapport dans : _qa/reports/{DATE}_migration-{000XX}_validator.md
```

---

## GATE 2 — Pré-Deploy

### Agent 4 · UX Auditor (toujours)

```
Lis le fichier `_agents/prompts/ux-auditor.md` pour les instructions complètes.

Story analysée : story-{XX-Y}                                    ← MODIFIER

Fichiers .tsx modifiés :
- {composant1.tsx}                                               ← MODIFIER
- {composant2.tsx}

Consulte packages/theme/tokens.ts et ux-design-specification.md.
Produis le rapport dans : _qa/reports/{DATE}_story-{XX-Y}_ux.md
```

---

### Agent 5 · Bug Hunter (toujours — lancer en dernier)

```
Lis le fichier `_agents/prompts/bug-hunter.md` pour les instructions complètes.

Story analysée : story-{XX-Y}                                    ← MODIFIER
Story path : _bmad-output/implementation-artifacts/story-{XX-Y}.md  ← MODIFIER

Fichiers modifiés :
- {fichier1}                                                     ← MODIFIER
- {fichier2}

Rapports précédents à lire :
- _qa/reports/{DATE}_story-{XX-Y}_code-review.md
- _qa/reports/{DATE}_story-{XX-Y}_security.md    (si existant)
- _qa/reports/{DATE}_story-{XX-Y}_ux.md

Produis le rapport dans : _qa/reports/{DATE}_story-{XX-Y}_bugs.md
Mets à jour _qa/summary.md avec le verdict final.
```

---

### Agent 6 · Regression Detector (si fichier partagé modifié)

```
Lis le fichier `_agents/prompts/regression-detector.md` pour les instructions complètes.

Story analysée : story-{XX-Y}                                    ← MODIFIER

Fichiers partagés modifiés (types / api-client / tokens / layout / migrations) :
- {fichier1}                                                      ← MODIFIER

Lis toutes les stories `done` dans _bmad-output/implementation-artifacts/.
Produis le rapport dans : _qa/reports/{DATE}_story-{XX-Y}_regression.md
```

> Déclencher si la story modifie : `entities.ts`, `enums.ts`, `api-client/*.ts`, `tokens.ts`, `_layout.tsx`, ou toute migration `.sql`.

---

## Ordre d'exécution par gate

```
Gate 1                              Gate 2
──────                              ──────
1. Code Reviewer ← toujours         1. UX Auditor         ← toujours
2. Migration Validator ← si .sql    2. Regression Detector ← si fichier partagé
3. Security Auditor ← si applicable 3. Bug Hunter          ← toujours (synthèse finale)
```

---

## Checklist rapide avant de lancer un agent

- [ ] Le fichier scope `_qa/gates/pre-pr/story-{XX-Y}-scope.md` est créé
- [ ] La story est marquée `in-review` dans son fichier `.md`
- [ ] La date est au format `YYYY-MM-DD` dans le nom du rapport

---

## Après les rapports — Mise à jour summary.md

Ouvrir `_qa/summary.md` et ajouter une ligne dans chaque tableau.
**30 secondes. Ne pas déléguer à un agent.**
