# Story 110.7 : Kill back-nav mobile partout + Filtres uniformisé style segmented

Status: done

## Story

En tant qu'**admin**,
je veux **plus aucune flèche "← Retour" en haut des pages mobile, et un bouton "Filtres" qui reprend le style discret du toggle Jour/Semaine/Mois (pas un pill blanc avec ombre proéminente)**,
afin de **gagner de la place verticale et d'avoir une UI cohérente où aucun élément secondaire ne crie plus fort que les actions principales**.

## Contexte

Screenshot 2026-05-03 (mobile portrait /activites/seances) :
- "← Séances" en haut sous AdminTopbar = back-nav généré par `Breadcrumb.tsx` mobile variant (story 100.4)
- "Filtres" rendu via `FilterSheet` trigger en pill blanc + boxShadow → trop proéminent vs segmented Jour/Semaine/Mois (fond muted, bordure none)

Cible : breadcrumb mobile entièrement masqué + trigger Filtres aligné visuellement sur le toggle temporel.

## Acceptance Criteria

- **AC1 — Pas de back-nav mobile** : `Breadcrumb.tsx` retourne `null` quand `width < 640` (avant rendu du chevron retour). Aucun "← Xxx" affiché en haut d'aucune page admin sur mobile.
- **AC2 — Filtres style segmented** : trigger mobile de `FilterSheet` adopte le même conteneur que `timeToggle` (fond `colors.light.muted`, padding 3, borderRadius `radius.xs`), avec le bouton interne au style `timeToggleBtnActive` (background surface, bordure divider). Pas de boxShadow.
- **AC3 — Cohérence sur toutes pages** : toute page consommatrice de `FilterSheet` (110.2 séances, et futures 110.6 présences, etc.) hérite automatiquement du nouveau style.
- **AC4 — Desktop inchangé** : variant `inline` desktop ne change pas.
- **AC5 — Conformité** : tokens `@aureak/theme` only, tsc OK.

## Tasks

- [x] Modifier `Breadcrumb.tsx` : early-return null si `width < 640`
- [x] Modifier `FilterSheet.tsx` style trigger pour matcher segmented timeToggle
- [x] tsc clean
- [x] Test runtime mobile : back-nav absent, Filtres style segmented

## Fichiers touchés

### Modifiés
- `aureak/apps/web/components/Breadcrumb.tsx` (kill mobile variant)
- `aureak/apps/web/components/admin/FilterSheet.tsx` (restyle trigger)

## Notes

- Pas de remplacement par un autre back-nav mobile : memoria projet `feedback_no_back_nav_mobile` à créer après.
- Si l'UX a besoin d'un retour, l'utilisateur passe par le drawer burger ou le geste navigateur natif.
