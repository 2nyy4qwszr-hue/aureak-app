date: 2026-04-03
status: in-progress

# Stratégie d'exécution
# Stories existantes → implémentées directement
# Nouvelles stories → créées via Story Factory juste avant implémentation
# Queue multi-jours — /go pour reprendre

queue:

  # ── STORIES EXISTANTES (fichiers déjà créés) ──────────────────

  - story_id: story-24-6
    title: "Mini-exercices liaison séquence"
    source: existing-review
    status: done
    gate1: pass
    gate2: pass
    commit: "155ea63"

  - story_id: story-1-4
    title: "Pipeline CI/CD, Tests & Standards de code"
    source: existing-review
    status: done
    gate1: pass
    gate2: pass
    commit: "7625be4"

  - story_id: story-12-1
    title: "Modèle données gamification (badges/points/ledger)"
    source: existing-phase2
    status: done
    gate1: pass
    gate2: pass
    commit: "63ad3a4"

  - story_id: story-12-2
    title: "Event bus gamification — 4 événements déclencheurs"
    source: existing-phase2
    status: done
    gate1: pass
    gate2: pass
    commit: "63ad3a4"

  - story_id: story-12-4
    title: "Quêtes hebdomadaires — attribution progression + récompenses"
    source: existing-phase2
    status: done
    gate1: pass
    gate2: pass
    commit: "63ad3a4"

  # ── NOUVELLES STORIES (créées juste avant implémentation) ──────

  - story_id: tbd-db-baseline-recovery
    title: "DB Baseline Recovery — migrations 00090+"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-export-pdf-joueur
    title: "Export PDF fiche joueur complète"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-recherche-globale
    title: "Recherche globale admin"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-route-players-orpheline
    title: "Route players/ orpheline — audit et redirection"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-presences-light-premium
    title: "Page presences/ — migration Light Premium"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-sidebar-icones-coherence
    title: "Cohérence icônes sidebar (active gold)"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-bulk-actions-joueurs
    title: "Bulk actions liste joueurs"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-pagination-serveur
    title: "Pagination serveur listes > 200 items"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-filtres-combines-seances
    title: "Filtres combinés séances (groupe + date + statut)"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-dashboard-coach
    title: "Vue dashboard coach dédiée améliorée"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-error-boundary
    title: "Error Boundary global admin"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-analytics-light-premium
    title: "Page analytics/ — audit et migration Light Premium"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-toasts-feedback
    title: "Feedback visuel (toasts) après actions admin"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-export-pdf-stage
    title: "Export PDF planning stage complet"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-parent-synthese
    title: "Vue parent synthèse enfant améliorée"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-coach-parent-light-premium
    title: "Apps (coach)/ et (parent)/ — audit Light Premium"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-audit-light-premium
    title: "Page audit/ — audit design Light Premium"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-onboarding
    title: "Onboarding premier lancement admin"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-filtres-persistants
    title: "Filtres persistants entre sessions (localStorage)"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-skeleton-loading
    title: "Skeleton loading sur pages lentes"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-import-csv-joueurs
    title: "Import CSV joueurs en masse"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-rapport-presences
    title: "Rapport présences exportable (PDF/CSV)"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-audit-timeline
    title: "Timeline audit log lisible et filtrable"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-access-grants-expiration
    title: "Accès temporaires avec date d'expiration"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-notifs-inapp
    title: "Notifications in-app temps réel (badge sidebar)"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-partnerships-design
    title: "Pages partnerships/ et grade-permissions/ — Light Premium"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-coach-historique-groupes
    title: "Fiche coach — historique de ses groupes"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-anomalies-actions
    title: "Anomalies — résolution inline sans redirection"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-messagerie-recherche
    title: "Recherche dans la messagerie admin"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-calendrier-seances
    title: "Calendrier visuel des séances (mensuel/hebdomadaire)"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-generation-groupes-saison
    title: "Génération automatique groupes par saison"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-vue-implantation
    title: "Vue agrégée par implantation (analytics)"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-historique-versions-joueur
    title: "Historique versions fiche joueur"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: tbd-digest-coach
    title: "Notification digest hebdomadaire coach (email lundi)"
    source: new
    status: pending
    gate1: pending
    gate2: pending
    commit: ""
