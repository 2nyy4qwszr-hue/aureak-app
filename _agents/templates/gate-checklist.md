# Checklist de Validation Humaine — Gates Aureak

> À remplir par le développeur avant de franchir chaque gate.
> Copier dans `_qa/gates/pre-pr/` ou `_qa/gates/pre-deploy/` selon le gate.

---

# Gate 1 — Pré-PR

**Story** : X-Y
**Date** : YYYY-MM-DD
**Branche** : `feature/story-X-Y-slug`

## Rapports agents à vérifier

- [ ] Rapport Code Reviewer lu → 0 BLOCKER confirmé
- [ ] Rapport Security Auditor lu (si applicable) → 0 BLOCKER confirmé
- [ ] Rapport Migration Validator lu (si applicable) → 0 BLOCKER confirmé

## Vérifications manuelles développeur

- [ ] L'implémentation correspond aux acceptance criteria de la story
- [ ] Aucun `console.log` de debug laissé dans le code
- [ ] Aucun `TODO` sans ticket associé introduit
- [ ] Les types TypeScript compilent sans erreur (`tsc --noEmit`)
- [ ] Les nouvelles migrations sont numérotées correctement (000XX suivant)
- [ ] La story est mise à jour → statut `in-review`, toutes les tasks cochées

## Warnings à documenter

| Warning | Fichier:ligne | Décision (accepté / ticket créé) |
|---------|---------------|----------------------------------|
| | | |

## Décision

- [ ] Gate 1 VALIDÉ → PR créée
- [ ] Gate 1 BLOQUÉ → retour dev

**Signé par** : (ton prénom)
**Notes** :

---

# Gate 2 — Pré-Deploy

**Story** : X-Y
**Date** : YYYY-MM-DD
**PR** : #XX
**Preview URL** : (si applicable)

## Rapports agents à vérifier

- [ ] Rapport UX Auditor lu → 0 BLOCKER confirmé
- [ ] Rapport Bug Hunter lu → 0 BLOCKER confirmé
- [ ] Warnings du Gate 1 traités ou re-validés

## Tests manuels en preview

- [ ] Feature testée sur le rôle principal concerné
- [ ] Feature testée sur les rôles secondaires concernés (si applicable)
- [ ] Loading states vérifiés (réseau lent simulé)
- [ ] États d'erreur vérifiés (données manquantes, API KO)
- [ ] Navigation retour/avant fonctionne
- [ ] Aucun `console.error` dans la console preview

## Vérifications design

- [ ] Cohérence visuelle avec le Design System Light Premium
- [ ] Responsive vérifié (mobile + desktop si web)
- [ ] Pas de style hardcodé introduit

## Vérifications base de données

- [ ] Migration appliquée en staging sans erreur (si applicable)
- [ ] RLS vérifié pour chaque rôle concerné
- [ ] Pas de données orphelines créées

## Story finale

- [ ] Story mise à jour → statut `done`
- [ ] `_qa/summary.md` mis à jour

## Décision

- [ ] Gate 2 VALIDÉ → déploiement production autorisé
- [ ] Gate 2 BLOQUÉ → retour dev

**Signé par** : (ton prénom)
**Notes** :
