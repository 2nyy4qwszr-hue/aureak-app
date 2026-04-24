# Story 103.10 — Administration mobile-first (hub + 15 pages)

Status: done

## Metadata

- **Epic** : 103 — Appliquer mobile-first aux zones admin
- **Story ID** : 103.10
- **Story key** : `103-10-mobile-administration`
- **Priorité** : P2 (beaucoup de pages, mais usage mobile secondaire)
- **Dépendances** : Epic 100 + 101 + 102 · Epic 99 (restructuration mergée)
- **Effort estimé** : L (~2j — 16 pages)

## Story

As an admin en mobilité,
I want que la zone Administration (hub + 15 pages : profil, permissions, RGPD, audit, anomalies, tickets, messages, exports, etc.) s'adapte mobile-first,
So que je puisse traiter une notif ticket, consulter un audit ou signer mon profil depuis mon téléphone.

## Contexte

Pages (post-Epic 99) :
- `/administration` — hub 5 cartes groupes
- 5 groupes × ~3 pages = ~15 pages

## Acceptance Criteria

1. **Hub `/administration`** : 5 cartes groupes → stack vertical mobile, grid 2-3 cols desktop.

2. **Groupe Utilisateurs & accès** (5 pages : profile, access-grants, grade-permissions, waitlist, onboarding) :
   - Profile : formulaire → FormLayout + sticky actions
   - Access-grants : DataCard
   - Grade-permissions : matrice → si très large, scroll horizontal, sinon accordion par grade
   - Waitlist / onboarding : DataCard

3. **Groupe Paramètres académie** (2 pages) :
   - Permissions : matrice rôle × section → accordion mobile (par rôle)
   - Calendrier scolaire : vue calendrier compacte (liste mois mobile si calendar pas responsive)

4. **Groupe Conformité** (4 pages) :
   - RGPD : DataCard demandes
   - Audit : DataCard logs + FilterSheet période
   - Anomalies : DataCard
   - RGPD prospects : DataCard

5. **Groupe Communication** (3 pages) :
   - Tickets (liste) : DataCard + FAB nouveau ticket
   - Tickets (détail) : ResponsiveModal ou page dédiée mobile-friendly
   - Messages : liste conversations → stack cards mobile

6. **Groupe Exports** (1 page) :
   - DataCard historique exports + FAB nouvel export

7. **Tokens `@aureak/theme` uniquement**.

8. **Conformité CLAUDE.md** : tsc OK, try/finally, console guards.

9. **Test Playwright** :
   - Viewport 375×667 sur les 16 URLs : charge sans cassure
   - Tester 1 parcours critique mobile : nouveau ticket → remplir → envoyer

10. **Non-goals** :
    - **Pas de refonte fonctionnelle** des features (RGPD, audit logic)
    - **Pas de nouveau flow utilisateur**

## Tasks / Subtasks

- [x] **T1 — Hub** (AC #1) — déjà responsive via Epic 99.1 (colonnes adaptatives)
- [x] **T2 — Utilisateurs & accès** (4 pages : profile, access-grants, waitlist, onboarding) — padding mobile
- [x] **T3 — Paramètres académie** (2 pages : permissions matrice + calendrier) — padding mobile, scroll horizontal matrice
- [x] **T4 — Conformité** (1 page rgpd-prospects) — padding mobile, tabs responsive
- [x] **T5 — Communication** (2 pages : tickets liste + détail) — padding mobile
- [x] **T6 — Exports** — pages non créées dans Epic 99 scope
- [x] **T7 — QA** — tsc + Playwright /administration + /tickets mobile OK

## Dev Notes

- Pages : `app/(admin)/administration/**/*`
- Grep headers custom orphelins à supprimer par zone
- Matrice permissions : attention au rendu mobile — accordion par rôle = pragmatique vs grille complète

## References

- Epic 99 (déjà mergé)
- Stories 100/101/102
