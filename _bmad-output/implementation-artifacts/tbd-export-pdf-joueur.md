# Story: Export PDF fiche joueur

**ID:** tbd-export-pdf-joueur
**Status:** done
**Source:** new
**Epic:** TBD — Admin Actions

## Description
Permettre l'export PDF de la fiche joueur via `window.print()`.

## Changements effectués
- `children/[childId]/page.tsx` : bouton "Exporter PDF" dans le header de navigation
  - Côte-à-côte avec "← Retour" (flexDirection row, justifyContent space-between)
  - `onPress={() => { if (typeof window !== 'undefined') window.print() }}`
  - Style : bouton bordé léger, texte muted

## Acceptance Criteria
- [x] Bouton "Exporter PDF" visible dans la fiche joueur
- [x] Appelle `window.print()` correctement
- [x] Guard SSR avec `typeof window !== 'undefined'`

## Commit
`feat(joueurs): export PDF via window.print()`
