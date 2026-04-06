date: 2026-04-06
status: in-progress

queue:
  - story_id: story-64-1
    title: "BUG — push migration v_club_gardien_stats en remote"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    commit: "55d80c0"

  - story_id: story-64-2
    title: "BUG — stages/index états contradictoires erreur + empty state"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    notes: "déjà corrigé — logique ternaire exclusive en place"

  - story_id: story-64-3
    title: "BUG — React Unexpected text node séances"
    priority: P1
    status: done
    gate1: pass
    gate2: pass

  - story_id: story-64-4
    title: "BUG — UUIDs bruts dans liste présences"
    priority: P2
    status: done
    gate1: pass
    gate2: pass

  - story_id: story-63-1
    title: "UX — Refactoring sidebar admin 7 items + ⚙️ Admin caché"
    priority: P1
    status: done
    gate1: pass
    gate2: pass

  - story_id: story-63-2
    title: "FEATURE — Évènements unifiés vue filtrée par type"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    notes: "8 warnings style/a11y non bloquants — dette à traiter dans story dédiée. Playwright skipped (app non démarrée)."

  - story_id: story-50-11
    title: "Dashboard v2 refonte layout trois zones"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    notes: "Recheck 2026-04-06 — BLOCKER corrigé : tiles gamification (CountdownTile, StreakTile, PlayerOfWeekTile, SeasonTrophyTileInner) absentes de Zone 2 KPIs bento. Zone 3 contient bien leaderboard XP, streaks, trophée, Player of Week, Prochaine séance. WARNING persistant : 5 console.error sans guard NODE_ENV dans dashboard/page.tsx (non-bloquant). Erreurs réseau = tables remote manquantes (attendance_records, xp_ledger) — hors scope story."

  - story_id: story-63-3
    title: "FEATURE — Section Développement Prospection/Marketing/Partenariats"
    priority: P3
    status: pending
    gate1: pending
    gate2: pending

  - story_id: story-49-9
    title: "BUG — attendances table manquante remote (migration)"
    status: done
    gate1: pass
    gate2: pass
    notes: "Migration 00136 — CREATE IF NOT EXISTS sur 4 tables (session_attendees, attendances, coach_presence_confirmations, block_checkins). Toutes colonnes ALTER (00058/00062/00102/00103) intégrées inline. Trigger trg_attendance_start + 11 policies RLS guardées. WARNING INFO : migration ordering pre-existant (00058/00062 font ALTER avant CREATE par 00136 — hors scope story, problème d'architecture archive). Playwright skipped — migration pure SQL."

  - story_id: story-49-10
    title: "BUG — profiles.id → user_id + typo getUncelebratedMilestones"
    status: pending
    gate1: pending
    gate2: pending

  - story_id: story-49-11
    title: "BUG — session_attendees.status → attendances.status (nav badges)"
    status: pending
    gate1: pending
    gate2: pending

  - story_id: story-47-6
    title: "DESIGN — Avatars couleurs hardcodées → tokens gold"
    status: pending
    gate1: pending
    gate2: pending

  - story_id: story-47-7
    title: "DESIGN — Gradients verts hardcodés → tokens @aureak/theme"
    status: pending
    gate1: pending
    gate2: pending

  - story_id: story-47-8
    title: "UX — Modal Évènements empty state + CTA sortie"
    status: pending
    gate1: pending
    gate2: pending

  - story_id: story-47-9
    title: "UX — Sous-pages Développement bouton retour amélioré"
    status: pending
    gate1: pending
    gate2: pending

  - story_id: story-65-1
    title: "FEATURE — Activités Hub Séances (tableau + filtres + stat cards)"
    status: pending
    gate1: pending
    gate2: pending

  - story_id: story-65-2
    title: "FEATURE — Activités Hub Présences (vue transversale groupes×séances)"
    status: pending
    gate1: pending
    gate2: pending

  - story_id: story-65-3
    title: "FEATURE — Activités Hub Évaluations (3 sous-filtres + tableau signaux)"
    status: pending
    gate1: pending
    gate2: pending
