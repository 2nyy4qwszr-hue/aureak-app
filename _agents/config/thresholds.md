# Seuils de Sévérité — Agents Aureak

## Définitions

### [BLOCKER]
Doit être corrigé **avant** de franchir le gate suivant.
Le pipeline s'arrête. Aucune exception.

Critères :
- Faille de sécurité exploitable (RLS absent, données exposées, secret hardcodé)
- Violation des règles d'architecture (accès Supabase hors `@aureak/api-client`, styles hardcodés hors tokens)
- Migration destructive non intentionnelle (DROP, ALTER COLUMN incompatible)
- Crash certain à l'exécution (undefined non géré sur chemin critique, typage cassé)
- Régression sur une feature déjà `done`
- Désynchronisation DB ↔ TypeScript (colonne présente en DB, absente dans types ou inversement)

### [WARNING]
Doit être corrigé dans **cette story ou la story suivante**.
Documenté obligatoirement dans `_qa/summary.md`.
Ne bloque pas le gate, mais laissé sans traitement = bloquant au gate suivant.

Critères :
- Mauvaise pratique non critique (console.log oublié, any TypeScript non justifié)
- Pattern UX incohérent mais non bloquant
- Performance sous-optimale (requête N+1 identifiée mais non critique)
- Gestion d'erreur incomplète sur chemin secondaire
- Todo/fixme introduit sans ticket associé

### [INFO]
Observation. Aucune action requise.
Utile pour la connaissance du codebase.

Critères :
- Suggestion d'amélioration future
- Observation neutre sur la structure
- Rappel d'une convention existante (non violée)

---

## Comptage par gate

### Gate 1 — Pré-PR
| Résultat | Action |
|----------|--------|
| 0 BLOCKER | Gate franchissable → validation humaine |
| ≥ 1 BLOCKER | Retour dev, correction, relance agent |
| Warnings | Documentés dans summary.md, PR créée avec note |

### Gate 2 — Pré-Deploy
| Résultat | Action |
|----------|--------|
| 0 BLOCKER tous agents | Gate franchissable → validation humaine finale |
| ≥ 1 BLOCKER | Retour dev, correction, relance agents concernés |
| Warnings non traités depuis Gate 1 | Devenus BLOCKER automatiquement |
