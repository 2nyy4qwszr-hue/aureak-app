# Template — Rapport d'Agent Aureak

> Copier-coller ce template pour chaque rapport. Supprimer les sections non pertinentes.

---

# Rapport [NOM_AGENT] — Story X-Y / Migration 000XX

**Date** : YYYY-MM-DD
**Agent** : code-review | security | migration-validator | ux | bugs
**Story** : `_bmad-output/implementation-artifacts/story-X-Y.md` (ou N/A)
**Fichiers analysés** : (liste des fichiers dans le scope)
**Déclencheur** : Gate 1 pré-PR | Gate 2 pré-deploy

---

## Résumé Exécutif

> 2-3 phrases. Ce qui a été analysé, verdict global, action requise.

**Verdict** : ✅ PASS | ❌ BLOCKED | ⚠️ PASS WITH WARNINGS

| Sévérité | Nombre |
|----------|--------|
| [BLOCKER] | 0 |
| [WARNING] | 0 |
| [INFO] | 0 |

---

## Issues Détectées

### [BLOCKER] — Titre court de l'issue

**Fichier** : `path/to/file.ts:42`
**Description** : Description précise du problème.
**Impact** : Quel risque concret si non corrigé.
**Correction suggérée** :
```typescript
// avant
code problématique

// après
code corrigé
```

---

### [WARNING] — Titre court

**Fichier** : `path/to/file.ts:87`
**Description** : Description du problème.
**Impact** : Risque limité / dette technique / dégradation UX.
**Correction suggérée** : Description courte ou snippet.

---

### [INFO] — Titre court

**Fichier** : `path/to/file.ts:12`
**Observation** : Observation neutre.

---

## Fichiers sans issue

> Liste des fichiers analysés qui ne présentent aucun problème.

- `path/to/clean-file.ts` — OK
- `path/to/another-file.tsx` — OK

---

## Verdict Final

- [ ] Zéro BLOCKER → gate franchissable
- [ ] Warnings documentés dans `_qa/summary.md`
- [ ] Validation humaine requise avant de continuer

**Action suivante** : [description de l'action requise ou "prêt pour validation humaine"]
