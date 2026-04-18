date: 2026-04-18
status: pending

# ──────────── QUEUE DU JOUR ────────────
# Epic 54 Présences premium + Story 49-4 (fix prérequis 54-1)
# Ordre : 49-4 d'abord (toggle pré-rempli) → 54-1 (grille squad remplace liste 49-4) → reste Epic 54 par priorité P2 → P3

new_queue:
  - story_id: story-49-4
    story_file: _bmad-output/implementation-artifacts/story-49-4-ux-presences-liste-enfants-groupe.md
    title: "UX — Présences : toggle présent/absent pré-rempli pour tous les joueurs du groupe"
    priority: P1
    status: pending
    gate1: null
    gate2: null

  - story_id: story-54-1
    story_file: _bmad-output/implementation-artifacts/story-54-1-presences-squad-overview.md
    title: "Présences — Squad Overview grille 4 colonnes cartes joueurs (remplace liste 49-4)"
    priority: P1
    status: pending
    gate1: null
    gate2: null

  - story_id: story-54-2
    story_file: _bmad-output/implementation-artifacts/story-54-2-presences-toggle-neumorphique.md
    title: "Présences — AttendanceToggle neumorphique @aureak/ui (shadow inset spring 150ms)"
    priority: P2
    status: pending
    gate1: null
    gate2: null

  - story_id: story-54-3
    story_file: _bmad-output/implementation-artifacts/story-54-3-presences-streak-joueur-affiche.md
    title: "Présences — Streak par joueur (sous-texte card, batch API getGroupMembersRecentStreaks)"
    priority: P2
    status: pending
    gate1: null
    gate2: null

  - story_id: story-54-4
    story_file: _bmad-output/implementation-artifacts/story-54-4-presences-zone-retardataires.md
    title: "Présences — Zone retardataires (section séparée status=late + bouton → Présent)"
    priority: P2
    status: pending
    gate1: null
    gate2: null

  - story_id: story-54-5
    story_file: _bmad-output/implementation-artifacts/story-54-5-presences-validation-groupee.md
    title: "Présences — Validation groupée (Tous présents + Promise.allSettled + micro-confetti)"
    priority: P2
    status: pending
    gate1: null
    gate2: null

  - story_id: story-54-6
    story_file: _bmad-output/implementation-artifacts/story-54-6-presences-heatmap-mensuelle-joueur.md
    title: "Présences — AttendanceHeatmap mensuelle @aureak/ui + section fiche joueur"
    priority: P2
    status: pending
    gate1: null
    gate2: null

  - story_id: story-54-7
    story_file: _bmad-output/implementation-artifacts/story-54-7-presences-alertes-absence-pattern.md
    title: "Présences — Alertes absence pattern (recordAttendance + inapp_notifications)"
    priority: P2
    status: pending
    gate1: null
    gate2: null

  - story_id: story-54-8
    story_file: _bmad-output/implementation-artifacts/story-54-8-presences-export-pdf-hebdomadaire.md
    title: "Présences — Export PDF hebdomadaire (window.print + HTML report builder)"
    priority: P3
    status: pending
    gate1: null
    gate2: null
