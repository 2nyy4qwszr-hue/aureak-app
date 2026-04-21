---
name: 'review-pr'
description: 'Review locale de la branche courante avant push — 5 agents en parallèle (code, security, migration, design, regression). Aucune API Anthropic consommée — tourne via abonnement Claude Code.'
---

Tu es le Coordinateur de PR Review locale d'Aureak. Jeremy tape `/review-pr` — il veut un audit rapide de sa branche courante AVANT de push.

Objectif : lever les mêmes BLOCKERs que les workflows CI `cto-review.yml` + `qa-gate1.yml`, mais en local via Task (sous-agents Claude Code), donc gratuit.

---

## 1. Détecter le scope

```bash
# S'assurer d'avoir origin/main à jour
git fetch origin main --quiet
CURRENT_BRANCH=$(git branch --show-current)

# Fichiers modifiés vs main
git diff --name-only origin/main...HEAD
```

**Cas d'arrêt** :
- Si `CURRENT_BRANCH == main` → `⚠️ Tu es sur main — bascule sur ta feature branch d'abord.`
- Si diff vide → `✅ Rien à review — branche alignée sur origin/main.`
- Si >40 fichiers modifiés → signaler la taille, demander confirmation avant de lancer (coût contexte sous-agent élevé).

Stocke la liste des fichiers dans une variable. Sépare par type :
- **SQL** : `supabase/migrations/*.sql` et `supabase/functions/*`
- **Code TS/TSX** : `aureak/packages/**` et `aureak/apps/**`
- **Docs/CI** : tout le reste (.md, .yml, config) → ne pas reviewer

Si les seuls fichiers modifiés sont docs/CI → `✅ Changement non-code, pas de review nécessaire.`

## 2. Lancer 5 agents en parallèle

**Dans UN SEUL MESSAGE**, lance 5 appels Task simultanés (general-purpose subagent_type) — un par axe de review. Chacun doit être bref (~150 mots max) pour ne pas saturer ton contexte.

Pour chaque agent, passe en prompt :
- Sa mission (ci-dessous)
- La liste des fichiers pertinents (filtre selon le type d'agent)
- L'instruction de produire un rapport structuré court

### Agent 1 — Code Reviewer

**Quand lancer** : si ≥1 fichier code TS/TSX modifié (sinon skip).

Mission (inline dans le prompt) :
> Lis `_agents/prompts/code-reviewer.md` pour ton mode opératoire complet. Focus immédiat (BLOCKERs obligatoires) :
> 1. Import Supabase direct hors `@aureak/api-client` → BLOCKER
> 2. Couleurs/sizes hardcodées (hex inline, px magique) → BLOCKER
> 3. `any` nu sans justificatif → BLOCKER
> 4. setState loading/saving sans try/finally → BLOCKER
> 5. `console.*` sans guard `NODE_ENV !== 'production'` dans apps/web ou api-client → WARNING
> 6. Routing Expo : `page.tsx` sans `index.tsx` → BLOCKER
> 
> Fichiers à analyser : {LISTE_CODE_TSX}
> 
> Format de sortie (markdown concis) :
> ```
> ## Code Review
> - [BLOCKER] `fichier.ts:42` — description + correction suggérée
> - [WARNING] `fichier.ts:17` — ...
> (vide si aucun issue)
> 
> Verdict : PASS | BLOCKED
> ```

### Agent 2 — Security Auditor

**Quand lancer** : si ≥1 fichier SQL ou TS/TSX modifié.

Mission :
> Lis `_agents/prompts/security-auditor.md`. Focus BLOCKER :
> 1. Nouvelle table SQL sans `ENABLE ROW LEVEL SECURITY`
> 2. Policy RLS manquante (SELECT/INSERT/UPDATE) sur table tenant-scopée
> 3. Secret hardcodé (API key, token) dans le code
> 4. `SECURITY DEFINER` sans `SET search_path` (risque injection)
> 5. Pattern `${var}` interpolé dans SQL brut sans bind params
> 
> Fichiers : {LISTE_SQL_TS}
> 
> Format identique Agent 1. Verdict PASS | BLOCKED.

### Agent 3 — Migration Validator

**Quand lancer** : si ≥1 `supabase/migrations/*.sql` modifié (sinon skip).

Mission :
> Lis `_agents/prompts/migration-validator.md`. Focus BLOCKER :
> 1. `CREATE TABLE` sans `IF NOT EXISTS` (non-idempotent)
> 2. `ALTER TYPE ADD VALUE` + usage de la valeur dans la même migration (SQLSTATE 55P04)
> 3. `ON CONFLICT ON CONSTRAINT <index_partiel>` (SQLSTATE 42704 — un UNIQUE INDEX partiel n'est pas une CONSTRAINT)
> 4. `DROP` ou `ALTER` destructif sans sauvegarde
> 5. Numérotation incorrecte — vérifier avec `ls supabase/migrations/ | tail -3`
> 6. `DELETE FROM` sans `WHERE tenant_id` dans backfill
> 
> Fichiers : {LISTE_SQL}
> 
> Format identique. Verdict PASS | BLOCKED.

### Agent 4 — Design Critic

**Quand lancer** : si ≥1 fichier `apps/web/app/**/*.tsx` modifié (sinon skip).

Mission :
> Lis `_agents/prompts/design-critic.md`. Focus BLOCKER :
> 1. Couleur hex inline (ex: `color: '#FF0000'`) au lieu de `colors.*`
> 2. `fontSize` numérique magique au lieu de `typography.*`
> 3. `padding`/`margin` hardcodé au lieu de `space.*`
> 4. `borderRadius` hardcodé au lieu de `radius.*`
> 5. `shadow` custom au lieu de `shadows.*`
> 
> Fichiers : {LISTE_TSX_UI}
> 
> Format identique. Verdict PASS | BLOCKED.

### Agent 5 — Regression Detector

**Quand lancer** : si ≥1 fichier dans `aureak/packages/` modifié (types/api-client/business-logic impactent tout le reste).

Mission :
> Lis `_agents/prompts/regression-detector.md`. Focus :
> 1. Signature de fonction exportée modifiée → chercher les usages dans `apps/` et signaler
> 2. Type `interface`/`type` exporté modifié → idem
> 3. Clé d'export supprimée de `index.ts` → BLOCKER si usage ailleurs
> 4. Enum `UserRole` ou `Record<UserRole,...>` modifié → BLOCKER (grep global obligatoire)
> 
> Fichiers : {LISTE_PACKAGES}
> 
> Format identique. Verdict PASS | BLOCKED.

## 3. Agréger les 5 rapports

Une fois les 5 sous-agents terminés (attendre tous, même si un échoue), produis un rapport consolidé :

```markdown
# 🔍 Review PR locale — {CURRENT_BRANCH}

**Fichiers analysés** : {N} fichiers ({X} code, {Y} SQL, {Z} UI)

## Synthèse par agent

| Agent | Verdict | BLOCKERs | WARNINGs |
|---|---|---|---|
| Code Reviewer | ✅/🚫 | N | N |
| Security Auditor | ✅/🚫 | N | N |
| Migration Validator | ✅/🚫 | N | N |
| Design Critic | ✅/🚫 | N | N |
| Regression Detector | ✅/🚫 | N | N |

## Issues détaillées

### 🚫 BLOCKERs ({total})
(liste agrégée tous agents confondus, par fichier:ligne)

### ⚠️ WARNINGs ({total})
(idem)

## Verdict global

- **Si ≥1 BLOCKER** → `🚫 BLOCKED — corrections requises avant push`
- **Si uniquement WARNINGs** → `🟡 PASS conditionnel — review humaine recommandée`
- **Si aucun issue** → `✅ PASS — safe to push`
```

## 4. Règles strictes

- **Ne modifie AUCUN fichier** — la review est read-only, c'est à Jeremy de corriger.
- **Ne commit, ne push rien.**
- **Lance les 5 agents en parallèle** — un seul message avec 5 blocs `Agent`.
- **Skip intelligemment** les agents non pertinents (pas de SQL modifié → skip Migration Validator, pas de UI → skip Design Critic, etc.).
- **Ne pas relancer** si l'user retape `/review-pr` sans avoir changé la branche.
- Si un sous-agent rate (timeout, erreur) → noter dans le rapport final mais continuer.

## 5. Message final à l'utilisateur

Après le rapport, termine par (selon verdict) :

**Si BLOCKED** :
> 🚫 Corrige les BLOCKERs listés ci-dessus avant `git push`. Relance `/review-pr` après correction.

**Si PASS** :
> ✅ Review locale OK. Tu peux `git push` et créer la PR en confiance.

**Si PASS conditionnel** :
> 🟡 Aucun BLOCKER mais {N} WARNINGs à considérer. Tu peux push, mais relis les lignes signalées avant.
