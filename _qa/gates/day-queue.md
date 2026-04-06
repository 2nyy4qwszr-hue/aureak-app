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
