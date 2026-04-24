# Story 103.8 — Partenariat mobile-first (3 pages)

Status: ready-for-dev

## Metadata

- **Epic** : 103 — Appliquer mobile-first aux zones admin
- **Story ID** : 103.8
- **Story key** : `103-8-mobile-partenariat`
- **Priorité** : P2
- **Dépendances** : Epic 100 + 101 + 102 · Epic 97.13 (template déjà appliqué)
- **Effort estimé** : S (~0.5j — 3 pages)

## Story

As an admin,
I want que les 3 pages Partenariat (sponsors liste, sponsor détail, clubs partenaires) s'adaptent mobile-first,
So que la consultation des sponsors et clubs partenaires soit fluide sur mobile.

## Contexte

Pages :
- `/partenariat` → redirect sponsors (inchangé)
- `/partenariat/sponsors` — liste
- `/partenariat/sponsors/[sponsorId]` — détail
- `/partenariat/clubs` — clubs partenaires

## Acceptance Criteria

1. **Liste sponsors** (`/partenariat/sponsors`) :
   - DataCard : nom sponsor (primary), type + contribution (secondary), enfants liés (tertiary)
   - FilterSheet : type (entreprise/individuel/association/club), actif/inactif
   - FAB "Nouveau sponsor" → ouvre ResponsiveModal `SponsorFormModal`

2. **Détail sponsor** (`/partenariat/sponsors/[sponsorId]`) :
   - `<AdminPageHeader>` titre dynamique
   - Contenu scrollable : infos + liste enfants liés (stack cards mobile)
   - Actions : Modifier (ouvre modal), Désactiver (prompt)

3. **Clubs partenaires** (`/partenariat/clubs`) :
   - DataCard : nom club partenaire, niveau accès, date début partenariat
   - FilterSheet : niveau accès (partner/common)

4. **`SponsorFormModal`** : adapté via `ResponsiveModal` (102.4) → full-screen sheet mobile.

5. **Tokens `@aureak/theme` uniquement**.

6. **Conformité CLAUDE.md** : tsc OK, try/finally, console guards.

7. **Test Playwright** :
   - Viewport 375×667 sur 3 URLs : cards stackées, FAB visible, modal full-screen
   - Viewport 1440×900 : layout inchangé

8. **Non-goals** :
   - **Pas de refonte fonctionnelle** flow sponsors/partenariat (Epic 92)
   - **Pas d'ajout de fonctionnalité** (parrainage, etc.)

## Tasks / Subtasks

- [ ] **T1 — Liste sponsors** (AC #1)
- [ ] **T2 — Détail sponsor** (AC #2)
- [ ] **T3 — Clubs partenaires** (AC #3)
- [ ] **T4 — SponsorFormModal ResponsiveModal** (AC #4)
- [ ] **T5 — QA** (AC #5-7)

## Dev Notes

- Pages : `app/(admin)/partenariat/**/*`
- Composants : `components/admin/partenariat/SponsorFormModal.tsx`

## References

- Epic 92 + Epic 97.13
- Stories 100/101/102
