# Story 99.6 — Administration : template + titres groupes "Communication" et "Exports"

Status: done

## Metadata

- **Epic** : 99 — Administration restructuration
- **Story ID** : 99.6
- **Story key** : `99-6-template-communication-exports`
- **Priorité** : P2
- **Dépendances** : **97.3** + **99.1** + **99.2**
- **Source** : Audit UI 2026-04-22. Uniformisation template sur 3 pages Communication + 1 page Exports.
- **Effort estimé** : M (~3-5h — 4 pages dont tickets avec liste + détail)

## Story

As an admin,
I want que les pages Communication (tickets liste, ticket détail, messages) et la page Exports utilisent le template `<AdminPageHeader />` v2 avec titre = sous-section,
So that les derniers groupes de la zone Administration soient alignés sur le design uniforme.

## Contexte

### Pages cibles après 99.2

**Communication** :
- `/administration/communication/tickets` — liste
- `/administration/communication/tickets/[ticketId]` — détail
- `/administration/communication/messages`

**Exports** :
- `/administration/exports`

### Titres

| URL | Titre |
|---|---|
| `/administration/communication/tickets` | "Tickets" |
| `/administration/communication/tickets/[ticketId]` | nom / sujet du ticket (dynamique) |
| `/administration/communication/messages` | "Messages" |
| `/administration/exports` | "Exports" |

## Acceptance Criteria

1. **Page Tickets (liste)** : `<AdminPageHeader title="Tickets" />`, action "+ Nouveau ticket" si applicable.

2. **Page Ticket (détail)** : titre dynamique = sujet du ticket (fallback "Ticket").

3. **Page Messages** : title "Messages".

4. **Page Exports** : title "Exports", action "+ Nouvel export" si applicable.

5. **Breadcrumb / retour** : lien "← Administration" sur les 4 pages.

6. **Cleanup** :
   - Retirer eyebrow/subtitle custom
   - Headers inline → AdminPageHeader
   - Hex → 0 match
   - StyleSheets orphelins supprimés

7. **try/finally + console guards** sur setters (notamment fetch tickets qui peut être long).

8. **Conformité CLAUDE.md** : tsc OK, tokens, api-client, Expo Router patterns, `page.tsx` + `index.tsx` re-export.

9. **Test Playwright** :
   - 4 pages chargent avec bons titres
   - Page ticket détail : titre dynamique affiche bon sujet
   - Console zéro erreur
   - Screenshots before/after

10. **Non-goals explicites** :
    - **Pas de refonte fonctionnelle** des tickets, messages, exports (workflows préservés)
    - **Pas de migration URL** (99.2)
    - **Pas de nouveau système de notification** ou workflow ticket

## Tasks / Subtasks

- [ ] **T1 — Page Tickets liste** (AC #1)
- [ ] **T2 — Page Ticket détail** (AC #2)
  - [ ] Titre dynamique depuis data fetch
- [ ] **T3 — Page Messages** (AC #3)
- [ ] **T4 — Page Exports** (AC #4)
- [ ] **T5 — Breadcrumb retour** (AC #5)
- [ ] **T6 — QA** (AC #8, #9)

## Dev Notes

### Titre dynamique ticket

Pattern :
```tsx
const { data: ticket } = useTicket(ticketId)
const title = ticket?.subject ?? 'Ticket'
return <AdminPageHeader title={title} />
```

### Page Exports

Probablement une liste des exports générés (CSV, Excel) avec bouton pour en créer de nouveaux. Préserver la logique métier.

### Page Messages

Système de messagerie interne (admin ↔ coachs/parents ?). Préserver l'UX conversationnelle existante.

### References

- Pages (post-99.2) : `app/(admin)/administration/communication/` + `app/(admin)/administration/exports/`
- Header : `components/admin/AdminPageHeader.tsx` (v2)
- Types et api-client : `@aureak/types`, `@aureak/api-client`
