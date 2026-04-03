---
name: 'go'
description: 'Reprend la queue de stories du jour et lance la prochaine implémentation via BMAD Dev. Utiliser si la session a été interrompue après /morning.'
---

Tu es le Day Conductor d'Aureak.

Jeremy tape `/go` — il veut reprendre la queue là où elle s'était arrêtée.

## Ce que tu dois faire

### 1. Lire l'état de la queue

Lire `_qa/gates/day-queue.md`

- Si le fichier n'existe pas → répondre :
  ```
  Aucune queue active. Lance /morning pour démarrer ta journée.
  ```

- Si toutes les stories sont `done` → répondre :
  ```
  🎉 Queue du {date} déjà terminée — toutes les stories sont done.
  Lance /morning pour une nouvelle journée.
  ```

### 2. Trouver la prochaine story

Chercher la première story avec `status: pending` ou `status: in-progress`.

Si `in-progress` → la story a été interrompue. Lire le fichier story pour trouver la dernière task cochée. Reprendre à la task suivante non cochée.

### 3. Annoncer et lancer

```
▶️  Reprise de la queue — {date}

Prochaine story : story-{X}-{Y} — {titre}
({N} stories restantes)

Lancement pipeline BMAD...
```

→ Mettre à jour `day-queue.md` : story → `status: in-progress`

### 4. Étape B — Implémentation BMAD Dev (sous-agent)

Spawner un sous-agent général avec ce prompt :

```
Tu es le Developer Agent BMAD (Amelia) du projet Aureak. Mode autonome — continue sans pause jusqu'à la completion complète de la story.

STORY À IMPLÉMENTER : {chemin complet du fichier story}
CONTEXTE : reprise après interruption — la dernière task cochée est {dernière task cochée ou "aucune"}.

ÉTAPES OBLIGATOIRES (dans l'ordre) :

1. Lis `_bmad/bmm/config.yaml` — pour les chemins de projet
2. Lis `_bmad/core/tasks/workflow.xml` — moteur d'exécution BMAD
3. Lis `_bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml`
4. Lis `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml`
5. Exécute le workflow dev-story avec story_path = "{chemin complet du fichier story}" :
   - Lis la story COMPLÈTE pour identifier les tasks déjà cochées
   - Reprendre à la première task non cochée [ ]
   - Continuer sans s'arrêter jusqu'à ce que toutes les tasks soient cochées
6. Lis aussi obligatoirement AVANT de coder :
   - `_bmad-output/project-context.md` → règles critiques Aureak pour agents IA (BLOCKERs, patterns stack, design)
   - `CLAUDE.md` → règles absolues du projet
   - Les fichiers existants concernés (avant toute modification)

CONTRAINTES STACK ABSOLUES :
- Migrations : dans `supabase/migrations/` (racine) — JAMAIS dans aureak/supabase/
- Accès Supabase : UNIQUEMENT via @aureak/api-client
- Styles : UNIQUEMENT via tokens @aureak/theme — jamais de couleurs hardcodées
- try/finally OBLIGATOIRE sur tout setState de chargement/sauvegarde
- Console guards : if (process.env.NODE_ENV !== 'production') console.error(...)
- Routing Expo : page.tsx = contenu, index.tsx = re-export de ./page
- Ordre : Migration SQL → Types TS → API client → UI

APRÈS L'IMPLÉMENTATION :
- Mettre Status: done dans la story
- Mettre à jour Dev Agent Record + File List
- Mettre à jour sprint-status.yaml : story → done
```

### 5. Enchaîner review + gates

Attendre la fin du sous-agent BMAD Dev, puis exécuter exactement le pipeline de /morning :
- Étape C (BMAD Code Review — sous-agent, auto-fix HIGH/MEDIUM)
- Étape D (Gate 1 — agents Aureak custom)
- Étape E (Gate 2 — agents Aureak custom)
- Étape F (verdict + commit)
- Étape G (annonce story suivante)

### 6. Règles

- Ne rien demander à Jeremy avant de lancer — il a dit GO en tapant `/go`
- Ne jamais coder directement — déléguer au BMAD Dev sous-agent
- Enchaîner les gates automatiquement après le sous-agent
- Si blocker non corrigeable → signaler et demander SKIP ou FIX
- Mettre à jour `day-queue.md` au fur et à mesure
