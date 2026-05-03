# Story 103.4 — Académie mobile-first (10 pages)

Status: done

## Metadata

- **Epic** : 103 — Appliquer mobile-first aux zones admin
- **Story ID** : 103.4
- **Story key** : `103-4-mobile-academie`
- **Priorité** : P2 (CRUD lourd — usage mobile rare, dernière dans l'ordre 103)
- **Dépendances** : Epic 100 + 101 + 102 · Epic 97.6/7/8/9 (déjà mergés)
- **Effort estimé** : L (~2j — 10 pages CRUD complexes)

## Story

As an admin,
I want que les 10 pages Académie (joueurs, coaches, groupes, scouts, manager, commercial, marketeur, clubs, implantations + hub) s'adaptent mobile-first pour la consultation, avec une édition simplifiée ou reportée en desktop selon complexité,
So que je puisse au moins consulter l'annuaire et faire des actions simples depuis mon téléphone.

## Contexte

Pages (post-Epic 97) :
- `/academie` — redirect joueurs (inchangé)
- `/academie/{joueurs,coaches}` — listes + `/[id]` détails
- `/academie/groupes/[groupId]`
- `/academie/scouts`
- `/academie/{manager,commercial,marketeur}` — 3 listings rôles
- `/academie/clubs` + `/[clubId]`
- `/academie/implantations`

## Acceptance Criteria

1. **Listes** (joueurs, coaches, clubs, implantations, rôles) :
   - DataCard : nom primary, email/rôle secondary, date arrivée tertiary
   - FilterSheet : statut actif, grade, implantation
   - Infinite scroll si data > 50

2. **Détail joueur** (`/academie/joueurs/[playerId]`) :
   - Hero existant (avatar + badges + chips) conservé
   - Sections : identité, parents, club, santé, évaluations — stack mobile avec accordion
   - Actions : éditer (ouvre ResponsiveModal), bulk actions (menu mobile)

3. **Détail coach** (`/academie/coaches/[coachId]`) :
   - Layout simple stack mobile
   - Actions : éditer, grade, historique

4. **Détail groupe** (`/academie/groupes/[groupId]`) :
   - Titre dynamique (nom groupe)
   - Liste joueurs du groupe → DataCard
   - Actions : générer joueurs (GroupGeneratorModal → ResponsiveModal)

5. **Détail club** (`/academie/clubs/[clubId]`) :
   - Layout cohérent détail joueur
   - Blocs : infos, enfants liés, affiliation saison

6. **Liste implantations** : DataCard + CTA "Gestion avancée" vers page legacy desktop (AC 97.9).

7. **Listings rôles** (manager, commercial, marketeur) : DataCard simple.

8. **Formulaire création joueur** (`/academie/joueurs/new`) :
   - FormWizard 4-5 étapes mobile, accordion desktop
   - FormLayout + sticky actions

9. **AcademieNavBar (8 tabs)** : déjà scrollable horizontal post-100.2.

10. **Tokens `@aureak/theme` uniquement**.

11. **Conformité CLAUDE.md** : tsc OK, try/finally, console guards.

12. **Test Playwright** :
    - Viewport 375×667 sur 10 URLs principales
    - Scenario : ouvrir liste joueurs → tap joueur → consulter détail → éditer (modal) → fermer

13. **Non-goals** :
    - **Pas de refonte bulk actions** complexes (gestion lourde reste desktop)
    - **Pas de refonte modals child complexes** (ScoutEvaluationModal, TrialInvitationModal, WaitlistModal = juste ResponsiveModal adapté)
    - **Pas d'édition hero joueur avancée** (drag-drop badges etc.)

## Tasks / Subtasks

- [ ] **T1 — Listes** (joueurs, coaches, clubs, implantations) (AC #1, #6)
- [ ] **T2 — Détails principaux** (joueur, coach, groupe, club) (AC #2, #3, #4, #5)
- [ ] **T3 — Listings rôles** (AC #7)
- [ ] **T4 — Formulaire création joueur wizard** (AC #8)
- [ ] **T5 — Modals children → ResponsiveModal** (AC #13)
- [ ] **T6 — QA** (AC #10-12)

## Dev Notes

- Pages : `app/(admin)/academie/**/*`
- Composants : `components/admin/academie/{AcademieNavBar,PeopleListPage,NewPersonForm,...}`
- Composants children : `components/admin/children/*` (`ChildDetail`, modals évaluation/trial/waitlist)

## References

- Epic 97.6/7/8/9 (templates et refontes déjà mergés)
- Stories 100/101/102
