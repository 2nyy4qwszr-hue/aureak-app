# Story: Historique des versions d'un joueur

**ID:** tbd-historique-versions-joueur
**Status:** done
**Source:** new
**Epic:** TBD — Admin UX

## Description
Ajouter une section "Historique des modifications" dans la fiche joueur (`children/[childId]/page.tsx`)
qui affiche les entrées du journal d'audit filtré par `entity_type = 'child_directory'` et `entity_id`.

## Changements effectués
- Import de `listAuditLogs` et type `AuditLog` depuis `@aureak/api-client`
- State `auditLogs: AuditLog[]` ajouté
- Chargement via `Promise.allSettled` dans `loadChild`
- Section "Historique des modifications" avant les Métadonnées :
  - Filtre client-side sur `entity_id === childId`
  - Affiche au max 15 entrées
  - Ligne par log : action, date, métadonnées compactes

## Acceptance Criteria
- [x] Section visible dans la fiche joueur
- [x] Entrées filtrées par entity_id (child)
- [x] Date + action affichées
- [x] Métadonnées compactes sur une ligne

## Commit
`feat(joueurs): historique des versions dans la fiche`
