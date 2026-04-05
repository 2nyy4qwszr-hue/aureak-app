# Story 59-7 — Gamification : Célébration milestone académie

**Epic** : 59 — Gamification XP & Achievements
**Status** : done
**Priority** : P2 — moments mémorables

---

## Contexte & objectif

Certains événements collectifs méritent une célébration spectaculaire : 100e séance validée, 500e joueur inscrit, 1 000e présence enregistrée. Quand un tel milestone est franchi, une animation plein écran se déclenche (confetti + message + badge collectif) la prochaine fois qu'un admin ouvre le dashboard.

---

## Dépendances

- Story 59-1 `done` — infrastructure XP disponible
- Epic 4 `done` — comptages sessions/attendances disponibles
- Story 59-6 `done` ou en parallèle — dashboard page disponible

---

## Acceptance Criteria

1. **AC1 — Table academy_milestones** : La migration 00121 crée `academy_milestones (id, tenant_id, milestone_code TEXT, milestone_label TEXT, threshold_value INTEGER, current_value INTEGER, reached_at TIMESTAMPTZ, celebrated BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(tenant_id, milestone_code))`. Les milestones initiaux insérés : `SESSION_100` (100 séances), `SESSION_500`, `PLAYER_500` (500 joueurs), `PLAYER_1000`, `ATTENDANCE_1000` (1000 présences), `ATTENDANCE_10000`. RLS : admin read/write, staff read.

2. **AC2 — Fonction SQL check_academy_milestones()** : La migration crée une fonction `check_academy_milestones(p_tenant_id UUID)` qui compare les valeurs actuelles (COUNT depuis `sessions`, `profiles`, `attendances`) aux thresholds et met à jour `reached_at` + `current_value` si le seuil est franchi. Retourne JSONB des milestones nouvellement atteints (`celebrated = false`).

3. **AC3 — Logique inline dashboard** : La page `dashboard/page.tsx` appelle `checkAndGetUnceledbratedMilestones()` (API client) au montage. Si des milestones non célébrés sont retournés, déclenche l'animation de célébration pour le premier non célébré, puis marque comme `celebrated = true` via `markMilestoneCelebrated(id)`.

4. **AC4 — Animation confetti** : Le composant `MilestoneCelebration.tsx` dans `@aureak/ui` affiche en overlay plein écran : 60 particules confetti CSS (couleurs `colors.accent.gold`, `colors.status.success`, `colors.accent.red`), texte central "{emoji} {label}" en `typography.display`, sous-texte "Académie Aureak — {date}", badge collectif doré. Durée totale 3 secondes, puis fade-out, `onDismiss` appelé.

5. **AC5 — Confetti CSS pur** : Les confetti sont des `<div>` positionnés aléatoirement avec `animation: fall Xs linear forwards` (keyframes CSS), pas de dépendance librairie externe. Position initiale aléatoire (0–100% width), vitesse aléatoire (1s–3s), rotation aléatoire. Seed aléatoire fixé au montage du composant (pas de re-render).

6. **AC6 — API milestones** : `aureak/packages/api-client/src/gamification/milestones.ts` exporte `getUnceledbratedMilestones()`, `checkAcademyMilestones()`, `markMilestoneCelebrated(id)`. Types `AcademyMilestone` dans `@aureak/types`.

7. **AC7 — Une célébration à la fois** : Si plusieurs milestones non célébrés existent, un seul est affiché par visite (le plus ancien par `reached_at`). Les suivants seront affichés aux prochaines visites. Pas de file d'attente complexe.

---

## Tasks

- [x] **T1** — Écrire `supabase/migrations/00132_academy_milestones.sql` : table, seed milestones, function check
- [x] **T2** — Créer `aureak/packages/api-client/src/gamification/milestones.ts`
- [x] **T3** — Créer `aureak/packages/ui/src/MilestoneCelebration.tsx` : confetti CSS, overlay, animation
- [x] **T4** — Ajouter type `AcademyMilestone` dans `@aureak/types/src/entities.ts`
- [x] **T5** — Intégrer logique célébration dans `dashboard/page.tsx`
- [x] **T6** — QA scan : pas de dépendance externe animation, tokens couleurs, console guards
- [x] **T7** — Cocher tasks, mettre Status: done

---

## Notes techniques

- Les confetti CSS pur (sans librairie) garantissent 0 dépendance supplémentaire et fonctionnent sur tous les navigateurs modernes.
- `celebrated = false` → `true` doit être updated **avant** de lancer l'animation suivante pour éviter de re-afficher en cas de navigation rapide.
- Les couleurs confetti sont hardcodées dans les keyframes CSS uniquement si on ne peut pas les injecter dynamiquement — exception documentée dans le commentaire du composant.

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00121_academy_milestones.sql` | Créer |
| `aureak/packages/api-client/src/gamification/milestones.ts` | Créer |
| `aureak/packages/ui/src/MilestoneCelebration.tsx` | Créer |
| `aureak/packages/types/src/entities.ts` | Modifier — AcademyMilestone |
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier — logique célébration |
