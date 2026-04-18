# Story 34.2 : Navigation Programme — UX Bibliothèque

Status: done

## Story

En tant qu'admin,
je veux une barre de navigation Méthodologie partagée et refactorisée (composant unique au lieu de NAV_TABS dupliqués dans chaque page),
afin que toute modification de navigation soit centralisée et que l'UX soit cohérente.

## Acceptance Criteria

1. **Composant partagé** `MethodologieNavBar` dans `methodologie/_components/MethodologieNavBar.tsx` — identique au pattern AcademieNavBar.
2. **Tab actif détecté via pathname** — plus de prop `active: true/false` statique.
3. **Toutes les pages méthodologie** importent et utilisent `MethodologieNavBar` dans leur headerBlock, remplaçant les NAV_TABS locaux.
4. **Fichiers nettoyés** : les constantes NAV_TABS locales sont supprimées de chaque page.
5. Le style est cohérent avec AcademieNavBar (même design tokens, même espacement).

## Tasks / Subtasks

- [x] T1 — Créer MethodologieNavBar.tsx
- [x] T2 — Intégrer dans seances/index.tsx (remplacer NAV_TABS local)
- [x] T3 — Intégrer dans programmes/index.tsx
- [x] T4 — Intégrer dans themes/index.tsx
- [x] T5 — Intégrer dans situations/index.tsx
- [x] T6 — Intégrer dans evaluations/page.tsx
- [x] T7 — Intégrer dans programmes/[programmeId]/index.tsx

## Dev Notes

### Fichiers créés
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/_components/MethodologieNavBar.tsx` | Créer |

### Fichiers modifiés
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | Remplacer NAV_TABS par MethodologieNavBar |
| `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` | Idem |
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Idem |
| `aureak/apps/web/app/(admin)/methodologie/situations/index.tsx` | Idem |
| `aureak/apps/web/app/(admin)/methodologie/evaluations/page.tsx` | Idem |
| `aureak/apps/web/app/(admin)/methodologie/programmes/[programmeId]/index.tsx` | Idem |

### Pas de migration SQL

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Completion Notes List
- MethodologieNavBar créé avec pathname-based active detection
- NAV_TABS locaux supprimés de toutes les pages méthodologie
- Pattern identique à AcademieNavBar

### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/_components/MethodologieNavBar.tsx` | Créé |
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/methodologie/situations/index.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/methodologie/evaluations/page.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/methodologie/programmes/[programmeId]/index.tsx` | Modifié |
