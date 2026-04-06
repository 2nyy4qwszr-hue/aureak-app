# Regression Detector — Story 63.2
Date : 2026-04-06
Story : `story-63-2-evenements-unifies-vue-filtree.md`

## Fichiers modifiés par la story

| Fichier | Type |
|---------|------|
| `supabase/migrations/00135_stages_add_event_type.sql` | Migration SQL |
| `aureak/packages/types/src/enums.ts` | Types partagés |
| `aureak/packages/types/src/entities.ts` | Types partagés |
| `aureak/packages/api-client/src/admin/stages.ts` | API partagée |
| `aureak/packages/api-client/src/academy/academyStatus.ts` | API partagée |
| `aureak/packages/api-client/src/index.ts` | Index API |
| `aureak/apps/web/app/(admin)/evenements/page.tsx` | UI (nouvelle page) |
| `aureak/apps/web/app/(admin)/evenements/index.tsx` | UI (re-export) |

---

## Étape 1 — Cartographie des fichiers partagés

| Fichier | Partagé ? | Raison |
|---------|-----------|--------|
| `migrations/00135_stages_add_event_type.sql` | Oui — global | Modifie le schéma de la table `stages` utilisée par toutes les stories stages |
| `packages/types/src/enums.ts` | Oui — global | Importé par `entities.ts`, `api-client`, `apps/web` |
| `packages/types/src/entities.ts` | Oui — global | Type `Stage` utilisé dans toutes les stories ayant des stages |
| `api-client/src/admin/stages.ts` | Oui — partagé | `listStages()` utilisé par `stages/index.tsx` et `children/[childId]/page.tsx` |
| `api-client/src/academy/academyStatus.ts` | Oui — partagé | `mapStage()` interne + `listAcademyStages()` interne |
| `api-client/src/index.ts` | Oui — global | Point d'entrée unique |
| `evenements/page.tsx` | Non — nouvelle page | Fichier créé, pas de dépendances existantes |
| `evenements/index.tsx` | Non — nouvelle page | Re-export, aucune logique |

---

## Étape 2 — Croisement avec stories `done`

### Migration 00135 — `stages.event_type`

| Stories `done` impactées | Type de risque | Analyse |
|--------------------------|----------------|---------|
| Toutes stories utilisant `stages` (Epic 48/49) | [INFO] | Migration `ADD COLUMN IF NOT EXISTS … DEFAULT 'stage'` — strictement additive, aucun data existant ne change. RLS inchangé. |
| Story 49.6 (design implantations) | [INFO] | La page `/implantations` n'accède pas directement à `stages` — pas d'impact. |

**Verdict** : Migration non destructive. Zéro régression certaine ou possible sur le schéma DB.

---

### `packages/types/src/enums.ts` — ajout `EventType`, `EVENT_TYPES`, `EVENT_TYPE_LABELS`

| Stories `done` impactées | Type de risque | Analyse |
|--------------------------|----------------|---------|
| Toutes stories important `@aureak/types` | [INFO] | Additions pures — aucun enum existant modifié. `export *` de `index.ts` = compatible |
| Story 1-2 (fondation types) | [INFO] | `enums.ts` agrandi mais aucune valeur existante modifiée |

**Verdict** : [INFO] uniquement — ajout non destructif.

---

### `packages/types/src/entities.ts` — `Stage.eventType: EventType`

| Stories `done` impactées | Type de risque | Analyse |
|--------------------------|----------------|---------|
| Story implémentant les stages (Epic 48/49) | [WARNING] | Le type `Stage` a un nouveau champ obligatoire `eventType: EventType`. Tout code qui crée un objet `Stage` manuellement (type assertion) devra inclure ce champ. En pratique, les seuls endroits qui créent des `Stage` sont les `mapStage()` dans api-client — et ces fonctions ont été mises à jour. Pas de création manuelle de `Stage` dans les pages UI. |
| `stages/index.tsx` | [INFO] | Consomme `StageWithMeta[]` de `listStages()` — utilise maintenant `eventType` implicitement (passthrough). Aucune rupture de type puisque le champ est ajouté, pas modifié. |
| `children/[childId]/page.tsx` | [INFO] | Utilise `StageWithMeta.name`, `.startDate`, `.endDate`, `.status` — n'accède pas à `eventType`. Pas d'impact. |
| `academyStatus.ts` — `mapStage()` interne | ✅ CORRIGÉ | La fonction `mapStage()` interne dans `academyStatus.ts` a été mise à jour pour inclure `eventType` (correction Gate 1). |

**Verdict** : [WARNING] potentiel sur le champ obligatoire — mais aucune régression effective détectée après inspection de toutes les utilisations.

---

### `api-client/src/admin/stages.ts` — `mapStage()` mise à jour + `listEvents()` ajoutée

| Stories `done` impactées | Type de risque | Analyse |
|--------------------------|----------------|---------|
| Story 53.8 (Season Planner) | [INFO] | `listStages()` signature inchangée (`Promise<StageWithMeta[]>`) — confirmé par lecture directe du fichier. L'ajout de `eventType` dans le retour est un champ optionnel d'un point de vue usage (ne casse pas les desctructurings existants). |
| `stages/index.tsx` | [INFO] | Utilise `listStages()` — signature préservée ✅ |
| `children/[childId]/page.tsx` | [INFO] | Utilise `listStages({ status: 'planifié' })` — paramètre toujours valide ✅ |
| `getStage()` — fiche `/stages/[stageId]` | [INFO] | `mapStage()` interne mis à jour inclut `eventType` avec fallback `'stage'`. Compatible rétrograde pour données sans `event_type` en DB. |

**Verdict** : [INFO] uniquement — backward compatible.

---

### `api-client/src/academy/academyStatus.ts` — `mapStage()` interne mis à jour

| Stories `done` impactées | Type de risque | Analyse |
|--------------------------|----------------|---------|
| Story 18.3 (statut académie) | [INFO] | `mapStage()` est purement interne à ce fichier, non exporté. La correction du fallback `'draft'` → `'planifié'` est un bugfix, pas un changement de comportement pour les usages normaux (la DB retourne toujours une valeur `status` valide). |
| Toute page utilisant `getChildAcademyStatus` | [INFO] | `listAcademyStages()` interne liste les stages pour un enfant — `eventType` ajouté en passthrough (`?? 'stage'`). Pas de rupture. |

**Verdict** : [INFO] + bugfix positif.

---

### `api-client/src/index.ts` — export `listEvents` ajouté

| Stories `done` impactées | Type de risque | Analyse |
|--------------------------|----------------|---------|
| Toutes stories important `@aureak/api-client` | [INFO] | Ajout d'un export uniquement — aucune suppression, aucune modification d'export existant |

**Verdict** : [INFO] — non destructif.

---

## Matrice d'impact

| Fichier modifié | Stories `done` impactées | Type de risque |
|-----------------|--------------------------|----------------|
| `supabase/migrations/00135_stages_add_event_type.sql` | Toutes stories `stages` | [INFO] — strictement additif |
| `packages/types/src/enums.ts` | Toutes stories `@aureak/types` | [INFO] — additions pures |
| `packages/types/src/entities.ts` | Stories consommant `Stage` / `StageWithMeta` | [WARNING] — champ obligatoire ajouté, mais toutes les fabriques mises à jour |
| `api-client/src/admin/stages.ts` | Stories 53.8, stages/index, children/[childId] | [INFO] — signature `listStages()` préservée |
| `api-client/src/academy/academyStatus.ts` | Story 18.3, pages statut académie | [INFO] — bugfix + ajout champ |
| `api-client/src/index.ts` | Tous packages importants | [INFO] — ajout export uniquement |
| `evenements/page.tsx` | Aucune story existante | — nouvelle page |
| `evenements/index.tsx` | Aucune story existante | — nouveau fichier |

---

## Verdict Régression

Régressions certaines ([BLOCKER]) : **0**
Régressions possibles ([WARNING]) : **1** — champ `eventType` obligatoire sur `Stage`, mais toutes les fabriques ont été correctement mises à jour. Aucune régression effective.
Stories `done` à retester manuellement : **stages/index** (vérifier que la liste stages charge toujours sans erreur), **children/[childId]** (vérifier l'onglet stages de la fiche enfant).

**Verdict global** : ✅ PASS — zéro régression effective détectée.
