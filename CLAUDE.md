# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Application Aureak — plateforme de gestion d'académie de football (gardiens de but).
Monorepo TypeScript : Expo Router (web + mobile), Supabase (PostgreSQL + RLS + Edge Functions), design system light premium.

## Stack technique

- **Apps** : `aureak/apps/web/` (admin/parent/coach/club/child), `aureak/apps/mobile/`
- **Packages** : `@aureak/types`, `@aureak/theme`, `@aureak/ui`, `@aureak/api-client`, `@aureak/business-logic`
- **Backend** : Supabase — migrations dans `supabase/migrations/`, Edge Functions dans `supabase/functions/`
- **Dev server** : `cd aureak && npx turbo dev --filter=web` → http://localhost:8081

## Règles absolues de code

1. **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais directement dans `apps/` ou `packages/business-logic/`
2. **Styles UNIQUEMENT via `@aureak/theme` tokens** — jamais de couleurs/espacements hardcodés
3. **Try/finally obligatoire** sur TOUT state setter de chargement/sauvegarde :
   ```typescript
   setSaving(true)
   try {
     await someApiCall()
   } finally {
     setSaving(false)
   }
   ```
4. **Console guards obligatoires** dans `apps/web/` et `packages/api-client/` :
   ```typescript
   if (process.env.NODE_ENV !== 'production') console.error('[Component] error:', err)
   ```
5. **Routing Expo Router** : `page.tsx` = contenu, `index.tsx` = re-export de `./page`
6. **Soft-delete uniquement** : `deleted_at nullable` — jamais de suppression physique sauf jobs RGPD
7. **Motion : `transform` / `opacity` uniquement** (Story 83-6). Jamais animer `width`, `height`, `top`, `left`, `margin`, `padding`. Utiliser `motion.ease.site` + `motion.duration.*` depuis `@aureak/theme` ou le hook `useEntryAnimation` depuis `@aureak/ui` pour les patterns d'entrée signature.

## Tooling

**Git workflow** : Standard git commands pré-autorisés.

**Dev server** :
```bash
cd aureak && npx turbo dev --filter=web
```

**Linting/types** :
```bash
cd aureak && npx tsc --noEmit
```

## Documentation & Code Generation

Toujours utiliser **Context7** (MCP Context7 tools) automatiquement quand :
- Génération de code utilisant une librairie ou framework
- Recherche de documentation d'API ou de configuration

Séquence : `mcp__context7__resolve-library-id` → `mcp__context7__query-docs` — sans attendre une demande explicite.

---

## Story Implementation Workflow

Les stories BMAD sont dans `_bmad-output/implementation-artifacts/`. Statuts possibles : `ready-for-dev`, `done`, `review`.
Le backlog ordonné est dans `_bmad-output/BACKLOG.md`.

### Avant de coder

1. Lire la story COMPLÈTE (story, AC, tasks, dépendances déclarées)
2. Vérifier que toutes les stories en dépendance sont `done` — si non, **STOP et signaler**
3. Lire les fichiers existants concernés avant toute modification

### Ordre d'implémentation par story

4. **Migration Supabase** en premier (numéroter en séquence après la dernière migration existante)
5. **Types TypeScript** dans `@aureak/types` — miroir exact du schéma DB
6. **Fonctions API** dans `@aureak/api-client/src/`
7. **UI** dans `apps/web/app/` — pages, composants, navigation
8. Cocher les tasks `[x]` dans le fichier story au fur et à mesure

### Après le code

9. **QA scan** sur les fichiers modifiés : vérifier try/finally et console guards
10. **Test Playwright** (voir section ci-dessous)
11. **Commit** : `feat(epic-X): story Y.Z — description courte`
12. Mettre `Status: done` dans le fichier story
13. **STOP** — attendre confirmation avant la story suivante (sauf instruction explicite d'enchaîner)

### Règles story

- Ne jamais implémenter plus que ce que la story demande
- Si une dépendance technique manque → signaler, ne pas improviser
- Si la story contredit l'architecture existante → signaler avant de coder
- 1 commit par story (sauf migrations séparées explicitement)

---

## Test Playwright post-story

Après chaque implémentation, tester la feature via Playwright MCP :

```
1. Vérifier que l'app tourne :
   Bash: curl -s -o /dev/null -w "%{http_code}" http://localhost:8081
   Si non → noter "Playwright skipped — app non démarrée" dans le commit

2. Naviguer vers la route de la feature implémentée
   mcp__playwright__browser_navigate → http://localhost:8081/(admin)/...

3. Screenshot pour vérifier le rendu visuel
   mcp__playwright__browser_take_screenshot

4. Vérifier les erreurs console
   mcp__playwright__browser_console_messages → zéro erreur JS

5. Tester au moins 1 interaction principale
   (formulaire → soumettre, navigation → vérifier route, liste → vérifier données)
```

Si des erreurs console sont détectées → les corriger avant le commit.

---

## QA — Patterns à vérifier systématiquement

Après chaque story, grep sur les fichiers modifiés pour détecter :

**BLOCKER** — state reset inline sans finally :
```bash
# Chercher setLoading/setSaving/setCreating inline (pas dans finally)
grep -n "setLoading(false)\|setSaving(false)\|setCreating(false)" <fichier>
```

**WARNING** — console non guardé :
```bash
grep -n "console\." <fichier> | grep -v "NODE_ENV"
```

**WARNING** — catch silencieux :
```bash
grep -n "catch(() => {})" <fichier>
```

**WARNING** — animation sur propriétés interdites (Story 83-6) :
```bash
# Une animation/transition ne doit toucher que transform et opacity
grep -En "Animated\.(timing|spring).*\.(width|height|top|left|margin|padding)|transition:.*\b(width|height|top|left|margin|padding)\b" <fichier>
```

---

## Migrations Supabase — Source de vérité unique

> **`supabase/migrations/` (racine du dépôt) est le seul dossier actif.**

### Structure
```
supabase/migrations/       ← SEUL DOSSIER ACTIF (00001–00110+)
supabase/config.toml       ← config Supabase active (lancer depuis la racine)
aureak/supabase/_archive/  ← archive lecture seule, ne pas modifier
aureak/supabase/config.toml ← config legacy, NE PAS lancer supabase depuis aureak/
```

### Règles
- **Ne jamais créer de migration dans `aureak/supabase/migrations/`** — ce dossier est archivé
- **Toujours lancer `supabase` depuis la racine du dépôt**, pas depuis `aureak/`
- Les anciennes stories référençant `aureak/supabase/migrations/` = documentation historique, les fichiers sont dans `supabase/migrations/` (racine) maintenant

### Numérotation
La dernière migration est visible via :
```bash
ls supabase/migrations/ | tail -5
```
Toujours incrémenter de 1. Format : `NNNNN_description_courte.sql`

### Démarrer Supabase localement
```bash
# Depuis la racine du dépôt uniquement
supabase start
supabase db push
```
