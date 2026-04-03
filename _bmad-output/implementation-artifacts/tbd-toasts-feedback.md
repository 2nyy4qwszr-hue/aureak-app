# Story: Feedback visuel (toasts) après actions admin

**ID:** tbd-toasts-feedback
**Status:** done
**Source:** new
**Epic:** TBD — UI Feedback

## Description
Créer un système de toasts léger : hook `useToast()` + composant `ToastProvider`. Intégrer dans `_layout.tsx`. Ajouter des toasts dans 3 pages admin après les actions CRUD.

## Acceptance Criteria
- [x] `ToastContext.tsx` avec `ToastProvider` + `useToast()` hook
- [x] Types : success, error, info, warning
- [x] Container fixe bottom-right avec animation slide
- [x] Auto-dismiss après 4s (6s pour errors)
- [x] Max 5 toasts simultanés
- [x] Intégré dans `_layout.tsx`
- [x] Toasts dans clubs/new.tsx (création club)
- [x] Toasts dans stages/new.tsx (création stage)
- [x] Toasts dans children/new/page.tsx (création joueur)

## Tasks
- [x] Créer `components/ToastContext.tsx`
- [x] Intégrer dans `_layout.tsx`
- [x] Ajouter toasts dans 3 pages CRUD
- [x] Commit

## Commit
`feat(admin): système toasts feedback après actions CRUD`
