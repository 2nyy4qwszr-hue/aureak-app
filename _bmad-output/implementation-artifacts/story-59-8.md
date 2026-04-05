# Story 59-8 — Gamification : Profil manager admin avec level + XP

**Epic** : 59 — Gamification XP & Achievements
**Status** : done
**Priority** : P2 — engagement direction

---

## Contexte & objectif

Les admins accumulent également des points (via les actions de gestion : séances créées, joueurs ajoutés, badges accordés, etc.). Cette story crée la page "Mon profil" admin avec : niveau et barre XP, badges débloqués admin, et stats d'activité (séances créées, joueurs gérés, évaluations accordées).

---

## Dépendances

- Story 59-1 `done` — `xp_ledger`, `resolveLevel()` disponibles
- Story 59-4 `done` — `BadgeGrid` amélioré disponible
- Epic 12 (phase 2) ou : les badges admin sont créés dans cette story si non existants

---

## Acceptance Criteria

1. **AC1 — Route admin profile** : La route `/(admin)/profile` est créée via `aureak/apps/web/app/(admin)/profile/page.tsx` + `index.tsx` (re-export). La page est accessible depuis la sidebar admin (lien "Mon profil" ou avatar en bas de sidebar).

2. **AC2 — Header profil** : La page affiche en haut : photo avatar (depuis `profiles.avatar_url`, fallback initiales), nom complet, rôle "Administrateur", date membre depuis, et un badge de niveau (couleur + label depuis `gamification.levels[tier]`).

3. **AC3 — Barre XP** : Sous le header, une barre XP pleine largeur : XP total actuel, XP du tier courant et XP nécessaire pour le prochain tier, percentage de remplissage. Animation fill via `gamification.xp.xpFill`. Couleurs via `gamification.xp.fillColor` / `gamification.xp.trackColor`. Si tier = 'legend', texte "Niveau maximum atteint".

4. **AC4 — Stats d'activité** : Grille 2×2 de KPI cards : "Séances créées", "Joueurs gérés", "Badges accordés", "Évaluations validées". Chaque card : chiffre grand `typography.stat`, label `typography.caption`, fond `colors.light.surface`, bordure `colors.border.light`, shadow `shadows.sm`. Données chargées via `getAdminActivityStats(adminId)`.

5. **AC5 — Grille badges admin** : Section "Mes badges" avec `BadgeGrid` (story 59-4). Les badges admins ont une source spécifique (`source IN ('admin_action')`) distinguée des badges joueur. Au minimum 5 badges admin sont définis : `ADMIN_VETERAN` (100 séances créées), `ADMIN_COACH_STAR` (10 coaches gérés), `ADMIN_BADGE_MASTER` (50 badges accordés), `ADMIN_SAISON_COMPLETE` (saison académique finalisée), `ADMIN_ARCHITECT` (5 stages créés).

6. **AC6 — Lien sidebar** : Le lien "Mon profil" est ajouté dans `aureak/apps/web/app/(admin)/_layout.tsx` ou la composante sidebar, en bas de la liste de navigation, avant "Déconnexion". Utilise l'avatar miniature et le prénom de l'admin connecté.

7. **AC7 — API admin stats** : `aureak/packages/api-client/src/gamification/admin-profile.ts` exporte `getAdminProfile(adminId)` et `getAdminActivityStats(adminId)`. Types `AdminProfile`, `AdminActivityStats` dans `@aureak/types`. Console guards et try/finally obligatoires.

---

## Tasks

- [x] **T1** — Créer `aureak/apps/web/app/(admin)/profile/page.tsx` + `index.tsx`
- [x] **T2** — Créer `aureak/packages/api-client/src/gamification/admin-profile.ts`
- [x] **T3** — Ajouter types `AdminProfile`, `AdminActivityStats` dans `@aureak/types/src/entities.ts`
- [x] **T4** — Implémenter barre XP avec animation CSS
- [x] **T5** — Intégrer `BadgeGrid` pour les badges admin
- [x] **T6** — Ajouter lien dans sidebar layout admin
- [x] **T7** — QA scan : try/finally, console guards, tokens, routing Expo Router (page.tsx + index.tsx)
- [x] **T8** — Cocher tasks, mettre Status: done

---

## Notes techniques

- L'admin n'a pas de table `player_progress` dédiée — ses XP viennent de `xp_ledger` filtrés par `child_id = auth.uid()` (même pattern). Une colonne `actor_type = 'admin'` peut être ajoutée en migration optionnelle ou la requête peut simplement filtrer par UUID.
- Les 5 badges admin à ajouter dans `00119_badges_definitions.sql` (story 59-4) ou une migration séparée si 59-4 n'est pas encore done.
- Si la sidebar est implémentée en composant séparé, l'identifier avant de modifier.

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/profile/page.tsx` | Créer |
| `aureak/apps/web/app/(admin)/profile/index.tsx` | Créer |
| `aureak/packages/api-client/src/gamification/admin-profile.ts` | Créer |
| `aureak/packages/types/src/entities.ts` | Modifier — AdminProfile, AdminActivityStats |
| `aureak/apps/web/app/(admin)/_layout.tsx` (ou composant sidebar) | Modifier — lien Mon profil |
