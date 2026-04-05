# Story 59-9 — Gamification : Notifications achievement toast temps réel

**Epic** : 59 — Gamification XP & Achievements
**Status** : done
**Priority** : P1 — feedback immédiat

---

## Contexte & objectif

Quand un badge est accordé à un joueur (n'importe quelle source), tous les admins et coaches connectés reçoivent un toast de notification en bas à droite : "🏆 Mohamed vient de débloquer Assidu". Le toast utilise Supabase Realtime pour la diffusion en temps réel et se ferme automatiquement après 5 secondes.

---

## Dépendances

- Story 59-4 `done` — badges définis, `player_badges` table disponible
- Epic 7 (notifications) ou migration `00110_inapp_notifications.sql` — notifications in-app infrastructure disponible
- Table `in_app_notifications` disponible (migration 00110)

---

## Acceptance Criteria

1. **AC1 — Composant AchievementToast** : `aureak/packages/ui/src/AchievementToast.tsx` accepte props `{ playerName: string, badgeLabel: string, badgeIconUrl?: string, onDismiss: () => void }`. Rendu : container fixe `position: fixed, bottom: 24px, right: 24px`, z-index élevé. Background `colors.light.surface`, bordure gauche 4px solid `colors.accent.gold`, shadow `shadows.gold`, border-radius `radius.card`. Icône badge (ou emoji 🏆 fallback) + texte "🏆 {playerName} vient de débloquer {badgeLabel}" en `typography.body`. Bouton × en `colors.text.subtle`.

2. **AC2 — Animation d'entrée/sortie** : Slide-in depuis la droite (translateX +100% → 0) en `transitions.normal` (0.2s). Slide-out vers la droite au dismiss ou après 5s. Pas de librairie externe animation.

3. **AC3 — Auto-dismiss 5 secondes** : Un `setTimeout` de 5000ms appelle `onDismiss` après l'affichage. Une barre de progression fine en bas du toast (couleur `colors.accent.goldLight`, height 3px) se réduit de 100% → 0% en 5s via CSS `animation: shrink 5s linear forwards`. L'utilisateur peut dismisser manuellement avant.

4. **AC4 — Listener Realtime dans layout admin** : `aureak/apps/web/app/(admin)/_layout.tsx` monte un channel Supabase Realtime sur la table `player_badges` (INSERT) filtré par `tenant_id`. À chaque nouvel INSERT, une requête complémentaire charge le nom du joueur + le label du badge, puis affiche le toast via un state `pendingToasts: AchievementToastData[]`. Un seul toast est visible à la fois (file FIFO, délai 500ms entre chaque).

5. **AC5 — File de toasts** : Si plusieurs badges sont accordés en rafale, les toasts s'enchaînent (pas de superposition). Le composant `ToastQueue` dans `_layout.tsx` gère un tableau de toasts en state, affiche le premier, et retire-le au dismiss avant d'afficher le suivant.

6. **AC6 — Performance** : Le channel Realtime est souscrit une seule fois (via `useEffect` avec dépendances vides + cleanup `supabase.removeChannel()`). Pas de re-souscription à chaque render. Le listener ne souscrit que si l'utilisateur est admin ou coach (vérification via `userRole` depuis le contexte auth).

7. **AC7 — Règles code** : Aucune couleur hardcodée dans `AchievementToast.tsx`. Console guards sur les erreurs Realtime. Le canal Realtime est fermé proprement au démontage du layout (`return () => supabase.removeChannel(channel)`).

---

## Tasks

- [x] **T1** — Créer `aureak/packages/ui/src/AchievementToast.tsx` : design, animation slide, auto-dismiss
- [x] **T2** — Ajouter export dans `aureak/packages/ui/src/index.ts`
- [x] **T3** — Ajouter listener Realtime dans `aureak/apps/web/app/(admin)/_layout.tsx`
- [x] **T4** — Implémenter `ToastQueue` state + logique FIFO dans le layout
- [x] **T5** — Fetch complémentaire : `profiles.display_name` + `badge_definitions.label` après INSERT Realtime
- [x] **T6** — QA scan : cleanup Realtime, tokens, console guards, pas de librairie externe
- [x] **T7** — Cocher tasks, mettre Status: done

---

## Notes techniques

- Supabase Realtime channel sur INSERT `player_badges` : `supabase.channel('achievements').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_badges', filter: `tenant_id=eq.${tenantId}` }, handler).subscribe()`.
- Le handler reçoit `new: { id, child_id, badge_id, ... }` — fetch séparé nécessaire pour les noms (les colonnes de jointure ne sont pas dans le payload Realtime par défaut).
- Accès Supabase dans `_layout.tsx` : passer par `@aureak/api-client` (règle absolue), pas d'import direct `supabase`.

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/ui/src/AchievementToast.tsx` | Créer |
| `aureak/packages/ui/src/index.ts` | Modifier — export AchievementToast |
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifier — Realtime listener + ToastQueue |
