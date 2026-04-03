# Story: Export PDF planning de stage

**ID:** tbd-export-pdf-stage
**Status:** done
**Source:** new
**Epic:** TBD — Admin Actions

## Description
Permettre l'export PDF du planning de stage via `window.print()`.

## Changements effectués
- `stages/[stageId]/page.tsx` : bouton "Exporter PDF" dans le header de navigation
  - Côte-à-côte avec "← Stages" (flexDirection row, justifyContent space-between)
  - `onPress={() => { if (typeof window !== 'undefined') window.print() }}`
  - Style : bouton bordé léger, texte muted

## Acceptance Criteria
- [x] Bouton "Exporter PDF" visible dans la fiche stage
- [x] Appelle `window.print()` correctement
- [x] Guard SSR avec `typeof window !== 'undefined'`

## Commit
`feat(stages): export PDF via window.print()`
