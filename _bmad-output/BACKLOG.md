# Backlog d'implémentation — Aureak

> Ordre d'exécution recommandé basé sur les dépendances inter-épics.
> Dernière mise à jour : 2026-04-01 (décisions produit finales)

---

## Légende
- `[x]` = done
- `[ ]` = ready-for-dev
- `[~]` = review
- `[d]` = deferred (mobile phase 2 ou hors scope)
- `[2]` = phase-2 (après fonctionnalités opérationnelles)

---

## Notes transversales (règles absolues avant de coder)

1. **Migrations** : toujours utiliser **00090+** (00001–00089 occupées). Ignorer les numéros dans les story files — ils sont obsolètes. Réservations actives : 00114 (story 49-6), 00115 (story 49-7), 00116 (story 49-8), 00117 (story 57-2/57-3 max_players), 00118 (story 57-5 fn hover stats), 00119 (story 57-6 fn compare), 00120 (story 58-2 diagram_json), 00121 (story 58-6 difficulty_level), 00122 (story 58-7 fn group avg level). **Dernière migration existante : 00135**. Prochaine disponible : **00136** (réservée story 49-9 — table attendances).
2. **Chemin UI `sessions` → `seances`** : les stories écrivent `(admin)/sessions/`. L'app réelle utilise `(admin)/seances/`.
3. **Chemin UI `referentiel` → `methodologie`** : les stories écrivent `(admin)/referentiel/`. L'app réelle utilise `(admin)/methodologie/`.
4. **Architecture packages** :
   - `@aureak/api-client` = accès Supabase / requêtes / mapping DB→TS uniquement
   - `@aureak/business-logic` = règles métier, validations, use cases, orchestration (EXISTS à `aureak/packages/business-logic/src/`)
5. **App mobile** : `apps/mobile/` différée. Stories mobile-only = `[d]`.
6. **DB remote vs repo** : le remote Supabase a ~30 tables sans migration dans le repo. Chantier séparé "DB baseline recovery" à traiter en parallèle (ne bloque pas le dev).

---

## Stories complétées (référence)

- [x] Epic 1 : Fondation monorepo (1-1, 1-2, 1-3)
- [x] Epic 2 partial : Accès clubs + RLS policies (2-5)
- [x] Epic 3 : Référentiel pédagogique (3-1, 3-2, 3-3, 3-4, 3-5, 3-6)
- [x] Epic 4 : Séances terrain (4-1, 4-2, 4-3, 4-5, 4-6, 4-7)
- [x] Epic 6 partial : Évaluations (6-1, 6-4)
- [x] Epic 7 partial : Notifications (7-2)
- [x] Epic 9 : Dashboard admin + anomalies + messagerie (9-1, 9-2, 9-3, 9-4, 9-5)
- [x] Epic 10 : RGPD + consentements + audit (10-1, 10-2, 10-3, 10-4, 10-5)
- [x] Epic 11 : Grades coaches + permissions contenu + partenariats (11-1, 11-2, 11-3)
- [x] Epic 13 : Séances v2 (13-1, 13-3)
- [x] Epic 18 : Joueurs admin (18-1, 18-2, 18-4, 18-5, 18-6, 18-7)
- [x] Epic 19 : Séances admin UI (19-4, 19-5)
- [x] Epic 20 : Méthodologie UX (20-1 → 20-5)
- [x] Epic 21 : Training builder (21-1, 21-2, 21-3)
- [x] Epic 22 : Création joueur qualité (22-1a, 22-1b, 22-2a, 22-2b, 22-3)
- [x] Epic 23 : Clubs visuels (23-1 → 23-5)
- [x] Epic 24 : Sections thème (24-1 → 24-7)
- [x] Epic 25 : Carte joueur premium (25-0 → 25-8)
- [x] Epic 26 : Carte club premium (26-1, 26-2)
- [x] Epic 27 : Theme card design (27-1, 27-2)
- [x] Epic 28 partial : Logos clubs (28-2, 28-3)
- [x] Epic 29 : Matricules RBFA (29-1)
- [x] Epic 30 : Script détection gardiens (30-1)
- [x] Epic 31 : Filtre saison académie (31-1)

---

## En attente de review

- [~] 1-4 : pipeline-ci-cd-tests-standards-de-code
- [~] 13-2 : sessions-calendrier-auto-generation-gestion-exceptions
- [~] 24-6 : mini-exercices-terrain

---

## Deferred — mobile phase 2 ou hors scope

- [d] 2-4 : auth-rapide-geolocalisee-pin-gps
- [d] 5-3 : enregistrement-presence-offline-2s
- [d] 6-2 : ux-evaluation-rapide-10s-par-enfant
- [d] 8-3 : ux-enfant-acquired-not-acquired-avatar-badges
- [d] 12-3 : avatar-system-equipement-items-debloquables
- [d] 12-5 : carte-de-progression-theme-collection-de-skill-cards

---

## Phase 2 — après fonctionnalités opérationnelles

- [2] 12-1 : modele-de-donnees-badges-points-ledger-cosmetiques-avatar
- [2] 12-2 : event-bus-gamification-traitement-des-4-evenements-declencheurs
- [2] 12-4 : quetes-hebdomadaires-attribution-progression-recompenses
- [2] 4-4 : planification-recurrente-gestion-des-exceptions
- [2] 6-3 : double-validation-coach-realtime-fallback-polling

---

## Backlog ordonné — ready-for-dev

**✅ Tout le backlog Phase 1 est implémenté** (stories 2-1→2-3, 5-1→5-6, 7-1→7-4, 8-1→8-5, 9-1→9-5, 10-1→10-5, 11-1→11-3, 28-1)

*Prochaine étape : DB Baseline Recovery + tests end-to-end*

---

### Epic 65 — Activités Hub Unifié (Séances · Présences · Évaluations)

- [ ] 65-1 : activites-seances-refonte-hub-tableau (P1 — route /activites, tableau séances avec pseudo-filtres temporels, stat cards, colonnes Statut/Date/Méthode/Groupe/Coach/Présence/Badges/K/C/Anomalie)
- [ ] 65-2 : activites-presences-vue-transversale (P1 — onglet Présences, vue groupes×séances en Global, heatmap joueurs×séances en Groupe, section À surveiller — dépend 65-1)
- [ ] 65-3 : activites-evaluations-vue-transversale (P2 — onglet Évaluations, 3 sous-filtres Badges/Connaissances/Compétences, grille badges joueurs, placeholders futurs modules — dépend 65-1)
- [ ] 65-4 : ux-filtresscope-pill-groupe-disabled (P1 quick-win — pill Groupe grisé + non-cliquable tant qu'aucune implantation sélectionnée, hint visible sous le pill, suppression message erreur tardif — dépend 65-1)
- [ ] 65-5 : tableau-seances-methode-coach-enrichi (P1 bug — colonnes MÉTHODE et COACH toujours vides, enrichir listSessionsWithAttendance avec JOIN methodology_sessions+session_coaches, brancher MethodeBadge et CoachAvatars — dépend 65-1)
- [ ] 65-6 : presences-vue-joueur-inline (P1 UX fix — supprime router.push auto sur scope Joueur, remplace par card résumé joueur + timeline 10 séances + stats 30j/totale + lien opt-in fiche complète — dépend 65-2)

**Dépendances** :
- 65-1 indépendant (nouvelle route, coexiste avec /seances existant)
- 65-2 dépend de 65-1 (partage FiltresContextuels + layout onglets)
- 65-3 dépend de 65-1 (même dépendances)
- 65-4 dépend de 65-1 (modifie FiltresScope.tsx créé en 65-1)
- 65-5 dépend de 65-1 (modifie TableauSeances.tsx + attendances.ts) — aucune migration DB
- 65-6 dépend de 65-2 (modifie presences/page.tsx) — aucune migration DB
- Aucune migration DB — UI uniquement, données existantes

---

### Epic 50 — Dashboard Club HQ

Ordre d'implémentation recommandé (dépendances en cascade) :

- [ ] 50-1 : dashboard-hero-band-salle-de-commandement (P1 — bandeau 160px #2A2827, logo AUREAK, date/heure, texture terrain SVG)
- [ ] 50-2 : dashboard-kpi-cards-sparkline-delta (P1 — SparklineSVG 6 semaines + DeltaPill ▲▼ — dépend 50-1)
- [ ] 50-3 : dashboard-prochaine-seance-countdown-tile (P1 — countdown H:MM:SS, card or, API listUpcomingSessions)
- [ ] 50-4 : dashboard-implantation-card-terrain-premium (P2 — header dégradé vert, badge joueurs or, chips groupes scroll)
- [ ] 50-7 : dashboard-anomalies-inline-compactes (P2 — pills cliquables → modale résolution, mise à jour optimiste)
- [ ] 50-8 : dashboard-widget-meteo-terrain (P2 — Open-Meteo API, cache 1h localStorage, recommandation extérieur)
- [ ] 50-5 : dashboard-live-activity-feed (P2 — colonne droite, Supabase Realtime channel, 20 events max)
- [ ] 50-6 : dashboard-forme-du-moment-tile (P2 — top 3 streaks ≥5 séances, initiales avatar, API getTopStreakPlayers)
- [ ] 50-9 : dashboard-focus-mode-plein-ecran (P3 — position:fixed, masque sidebar/topbar, Escape pour quitter)
- [ ] 50-10 : dashboard-tiles-kpi-reorganisables (P3 — DnD HTML5 natif, ordre localStorage, bouton reset)
- [ ] 50-11 : dashboard-v2-refonte-layout-trois-zones (P1 — suppression Hero Band + feed latéral, Zone 1 Briefing du jour avec date card + implantations, Zone 2 KPIs, Zone 3 Gamification)

**Dépendances** :
- 50-2 dépend de 50-1 (Hero Band — bouton ⛶ partagé)
- 50-9 dépend de 50-1 (bouton ⛶ dans le Hero Band)
- 50-5 nécessite l'export du client Supabase depuis `@aureak/api-client`
- 50-3 et 50-6 nécessitent de vérifier le nom exact des tables `sessions` et `attendance_records`
- 50-11 intègre et remplace 50-1/50-4/50-5 (Hero Band, ImplantationCard premium, feed latéral) — UI only, aucune migration
- Migration max utilisée : aucune (Epic 50 = UI uniquement, pas de migration DB nécessaire)

---

### Epic 52 — Player Cards Ultimate Squad

Ordre d'implémentation recommandé (dépendances en cascade) :

- [ ] 52-1 : player-card-fut-style (P1 — composant PlayerCard 160×220px tiers visuels — `@aureak/ui`)
- [ ] 52-2 : stats-gardien-6-attributs (P1 — PLO/TIR/TEC/TAC/PHY/MEN + computePlayerTier — dépend 52-1)
- [ ] 52-4 : toggle-galerie-liste (P1 — vue grille cards vs liste, localStorage — dépend 52-1)
- [ ] 52-5 : filtres-tier-pills (P1 — pills colorées multi-sélection — dépend 52-2 + 52-4)
- [ ] 52-6 : header-photo-fullwidth (P1 — header 280px + tabs fiche joueur — dépend 52-1)
- [ ] 52-3 : shimmer-animation-elite (P2 — @keyframes CSS bordure Elite — dépend 52-1 + 52-2)
- [ ] 52-7 : xp-bar-animee (P2 — XPBar Animated.Value, composant @aureak/ui — dépend 52-6)
- [ ] 52-9 : badges-collection (P2 — BadgeGrid 10 badges statiques — dépend 52-6)
- [ ] 52-10 : radar-chart-svg (P2 — RadarChart SVG pur 6 axes — dépend 52-2)
- [ ] 52-8 : card-evolution-animation (P3 — flip+flash level up — dépend 52-6 + 52-2)
- [ ] 52-12 : vue-master-detail (P2 — split-screen desktop liste+fiche — dépend 52-4 + 52-6)
- [ ] 52-11 : export-card-png (P3 — html2canvas PNG + Web Share API — dépend 52-1 + 52-6)

---

### Epic 53 — Séances "Training Ground"

Ordre d'implémentation recommandé (dépendances en cascade) :

- [ ] 53-1 : seances-vue-semaine-tactical-board (P1 — grille slots colorés par méthode + charge hebdo — WeekView.tsx)
- [ ] 53-2 : seances-fiche-header-match-report (P2 — header premium dark + stripe or + badge méthode grand format)
- [ ] 53-3 : seances-intensite-indicator (P2 — barre 5 niveaux ⬤⬤⬤⬤○ or/rouge — migration + API updateSessionIntensity)
- [ ] 53-4 : seances-selecteur-methode-tuiles (P2 — grandes tuiles icône+couleur remplaçant le dropdown)
- [ ] 53-5 : seances-duplication-rapide (P2 — bouton Dupliquer → prefill query params dans new.tsx)
- [ ] 53-6 : seances-rapport-post-entrainement (P2 — section Résumé sur séance réalisée : présence%, note moy., top joueur)
- [ ] 53-7 : seances-badge-serie-sans-absence (P3 — badge fire sur joueurs avec 5+ présences consécutives)
- [ ] 53-8 : seances-season-planner (P3 — nouvelle page /seances/planner grid 5 semaines × groupes)
- [ ] 53-9 : seances-filtres-presets-enregistrables (P3 — pills présets sauvegardés localStorage)
- [ ] 53-10 : seances-coaches-drag-drop (P3 — DnD HTML5 natif zones Disponibles/Assignés)

**Dépendances** :
- 53-1 : indépendant (améliore WeekView existant)
- 53-2 : indépendant (refacto header [sessionId]/page.tsx)
- 53-3 : migration DB requise (numéroter après dernière migration)
- 53-5 dépend de 53-4 (tuiles méthode — optionnel, peut être développé indépendamment)
- 53-6 requiert vérification de `listEvaluationsBySession` dans l'API
- 53-7 : peut partager la logique `getPlayerPresenceStreaks` avec 54-3
- 53-8 : nouvelle route `/seances/planner` — créer `page.tsx` + `index.tsx`

---

### Epic 54 — Présences "Squad Status Board"

Ordre d'implémentation recommandé (dépendances en cascade) :

- [ ] 54-1 : presences-squad-overview (P1 — grille 4 colonnes cartes joueurs avec statut — remplace liste verticale 49-4)
- [ ] 54-2 : presences-toggle-neumorphique (P2 — composant AttendanceToggle dans @aureak/ui, shadow inset spring 150ms)
- [ ] 54-3 : presences-streak-joueur-affiche (P2 — sous-texte streak par joueur — batch API getGroupMembersRecentStreaks)
- [ ] 54-4 : presences-zone-retardataires (P2 — section séparée joueurs status='late' + bouton → Présent)
- [ ] 54-5 : presences-validation-groupee (P2 — bouton Tous présents + Promise.allSettled + micro-confetti)
- [ ] 54-6 : presences-heatmap-mensuelle-joueur (P2 — composant AttendanceHeatmap dans @aureak/ui + section fiche joueur)
- [ ] 54-7 : presences-alertes-absence-pattern (P2 — inline dans recordAttendance, inapp_notifications, bandeau orange)
- [ ] 54-8 : presences-export-pdf-hebdomadaire (P3 — window.print() + HTML report builder + bouton vue Semaine)

**Dépendances** :
- 54-1 dépend de 49-4 (ou l'intègre — à vérifier si 49-4 est done)
- 54-2 indépendant (nouveau composant @aureak/ui)
- 54-3 dépend de 54-1 (SquadCard) et partage logique avec 53-7
- 54-4 dépend de 54-1 (segmentation de la grille)
- 54-5 dépend de 49-4 (recordAttendance) et 54-1 (grille)
- 54-6 indépendant (fiche joueur, nouveau composant heatmap)
- 54-7 dépend de 49-4 (recordAttendance hook point d'injection)
- 54-8 indépendant (page séances, vue semaine)

---

### Epic 49 — Bugfix + UX + Design batch avril 2026 #2

- [ ] 49-4 : ux-presences-liste-enfants-groupe (P1 — toggle présent/absent pré-rempli pour tous les joueurs du groupe)
- [ ] 49-2 : ux-blocs-themes-editables-fiche-seance (P2 — section thèmes non éditable post-création)
- [ ] 49-5 : design-dashboard-game-manager-premium (P2 — hero band, sparkline KPIs, ImplantationCard terrain, next session tile)
- [ ] 49-6 : design-implantations-photo-logo-redesign (P2 — photo/logo implantation Storage + header premium + groupes cards)
- [ ] 49-7 : feature-affiliation-auto-joueur-club-saison (P3 — vue SQL + affichage auto club saison courante dans fiche joueur)

### Epic 47 — Design/UX batch

- [ ] 47-1 : design-sidebar-icones-navigation
- [ ] 47-2 : design-implantation-visuel-photo-groupes-card
- [ ] 47-3 : ux-hub-seances-unifie
- [ ] 47-4 : feature-liaisons-joueurs-clubs-affiliation-saison
- [ ] 47-5 : bug-sidebar-lien-groupes-404
- [ ] 47-6 : design-avatars-tokens-gold (P1 — PALETTE violet/bleu hardcodée dans children/[childId]/page.tsx → tokens @aureak/theme)
- [ ] 47-7 : design-gradients-tokens-dashboard (P1 — gradients verts terrain hardcodés lignes 26/640/849 dans dashboard/page.tsx → tokens @aureak/theme)
- [ ] 47-8 : ux-evenements-empty-state-cta (P1 — dead-end UX : filtre Tournoi → liste vide sans CTA. Empty state dédié + CTA "Créer un Stage" + label "Bientôt disponible" dans modal)
- [ ] 47-9 : ux-developpement-breadcrumb-retour (P1 — bouton retour invisible/non affordant dans sous-pages Développement → enrichir Pressable : état hover/pressed + fond `colors.light.hover` + bordure + `router.back()`)

### Epic 45 — Design System v3

- [ ] 45-1 : design-system-montserrat-gamification-tokens (Montserrat + XP/niveaux/badge tokens)

### Epic 42 — Dashboard & Présences redesign

- [ ] 42-1 : dashboard-bento-redesign
- [ ] 42-2 : presences-redesign-visual-compact

### Epic 43 — Méthodologie UX

- [ ] 43-1 : bug-delete-methodologie-seance (P1)
- [ ] 43-2 : methodologie-cards-compactes
- [ ] 43-3 : modules-goal-player

### Epic 44 — Bugs & UX coaching/joueurs

- [ ] 44-1 : bug-edge-function-create-coach (P1)
- [ ] 44-2 : bug-filtre-saison-actuelle-joueurs (P1)
- [ ] 44-3 : ux-creation-coach-role-prefill
- [ ] 44-4 : fiche-joueur-parents-club-liens
- [ ] 44-5 : mini-stats-joueur-groupe
- [ ] 44-6 : implantation-stats-enfants

### Epic 49 — Bugfix batch avril 2026 #2

- [ ] 49-9 : bug-attendance-table-manquante-remote (P0 — table `attendances` absente en remote → PGRST205 dashboard + score académie cassés — migration 00136)
- [ ] 49-8 : bug-dashboard-get-implantation-stats-erreur-400 (P1 — fn SQL manquante → tiles KPI vides)
- [ ] 49-10 : bug-profiles-id-milestones (P1 — typo getUncelebratedMilestones + doc correctif profiles.id → user_id — MilestoneCelebration jamais affichée)
- [ ] 49-11 : bug-nav-badges-session-attendees (P1 — `column session_attendees_1.status` → topbar séance active muette — remplacer session_attendees par attendances dans getActiveSession*)
- [ ] 49-1 : bug-creation-coach-edge-function (P1 — non-2xx persistant malgré story 44-1)
- [ ] 49-3 : bug-joueurs-club-non-visibles (P2 — section annuaire manquante dans fiche club)

### Epic 34 — Programme pédagogique

- [ ] 34-1 : architecture-programme-pedagogique-formulaire-intelligent (P1)
- [ ] 34-2 : navigation-programme-ux-bibliotheque (P1 — dépend 34-1)

### Epic 51 — Navigation & Shell Game HUD

> Ordre d'implémentation recommandé : 51-1 → 51-7 → 51-4 → 51-2 → 51-5 → 51-6 → 51-3 → 51-8

- [ ] 51-1 : sidebar-active-state-barre-or-icones-svg (P1 — icônes SVG remplacement emojis + active state gold consolidé)
- [ ] 51-7 : sidebar-collapse-smooth-animation (P2 — animation 280ms + tooltips mode collapsed — dépend 51-1)
- [ ] 51-4 : notification-badges-sidebar (P2 — pastilles rouge/or présences+séances — dépend 51-1)
- [ ] 51-2 : topbar-seance-active-permanente (P2 — barre gold séance en cours + polling 60s — API getActiveSession)
- [ ] 51-5 : breadcrumb-anime-retour-cliquable (P2 — fil d'Ariane + BreadcrumbContext + animation 200ms)
- [ ] 51-6 : raccourcis-clavier-navigation (P2 — chords G J / N S + overlay aide ? — coordonner avec 51-3)
- [ ] 51-3 : command-palette-cmd-k (P3 — overlay ⌘K recherche unifiée joueurs+clubs+séances+nav)
- [ ] 51-8 : dark-mode-complet-toggle-persistant (P3 — tokens dark.* + ThemeContext + toggle sidebar — dépend 51-1)

### Epic 55 — Évaluations "Player Report"

Ordre d'implémentation recommandé (dépendances en cascade) :

- [ ] 55-1 : evaluations-card-fut-style-note-centrale (P1 — composant EvaluationCard FUT gold/silver/rouge, `@aureak/ui`)
- [ ] 55-3 : evaluations-timeline-croissance-joueur (P1 — GrowthChart SVG ligne gradient, fiche joueur — dépend 55-1)
- [ ] 55-4 : evaluations-badge-best-session-animation (P1 — BestSessionBadge spring + isPersonalBest API — dépend 55-1)
- [ ] 55-6 : evaluations-filtre-joueurs-en-danger (P1 — listDangerousPlayers, alertes rouge, filtre children — dépend 55-1)
- [ ] 55-2 : evaluations-radar-chart-comparaison-2-joueurs (P2 — RadarChart SVG 6 axes, page comparison — dépend 55-1)
- [ ] 55-5 : evaluations-comparaison-biais-coach (P2 — tableau delta coachs, export CSV, admin only — dépend 55-1)
- [ ] 55-8 : evaluations-joueur-de-la-semaine-dashboard (P2 — PlayerOfWeekTile, confetti localStorage — dépend 55-1)
- [ ] 55-7 : evaluations-export-scouting-pdf (P3 — @react-pdf/renderer, ScoutingPDF A4 — dépend 55-2 + 55-3)

---

### Epic 56 — Groupes "Team Sheets Premium"

Ordre d'implémentation recommandé (dépendances en cascade) :

- [ ] 56-1 : groupes-card-team-sheet-formation-visuelle (P1 — GroupCard mini-terrain SVG, grille groups/index — `@aureak/ui`)
- [ ] 56-3 : groupes-player-avatars-grille-card (P1 — PlayerAvatarGrid avatars colorés tiers, intégration GroupCard — dépend 56-1)
- [ ] 56-6 : groupes-capacite-indicateur-alerte (P1 — CapacityIndicator rouge/orange/neutre, max_players — dépend 56-1)
- [ ] 56-5 : groupes-badge-groupe-du-mois (P2 — GroupOfMonthBadge shimmer, getTopGroupByAttendance — dépend 56-1)
- [ ] 56-2 : groupes-formation-tactique-visuelle-terrain (P2 — TacticalBoard SVG 11 positions, migration 00114 — dépend 56-1)
- [ ] 56-4 : groupes-drag-drop-transfer-joueur (P2 — drag HTML5, modal confirmation, transferGroupMember — dépend 56-1 + 56-3)
- [ ] 56-7 : groupes-generateur-auto-groupes-par-age (P2 — GroupGeneratorModal, catégories U10/U12/U14/U17 — dépend 56-1)
- [ ] 56-8 : groupes-transition-slide-fiche-joueur (P3 — slide 300ms cubic-bezier, prefers-reduced-motion — dépend 56-2)

---

### Epic 57 — Implantations "Facilities Manager"

Ordre d'implémentation recommandé (dépendances en cascade) :

- [ ] 57-2 : implantations-header-detail-premium (P1 — header 280px + badge capacité + bouton éditer + gradient enrichi — dépend 49-6)
- [ ] 57-3 : implantations-capacite-barre-remplissage (P1 — barre vert/or/rouge + label X/Y joueurs — dépend 49-6 + 57-2 pour max_players)
- [ ] 57-1 : implantations-photo-drag-drop-premium (P2 — drag & drop + preview locale + compression 800px — dépend 49-6)
- [ ] 57-8 : implantations-mini-timeline-prochaines-seances (P2 — 3 prochaines séances sur card + lien — dépend 49-6)
- [ ] 57-5 : implantations-overlay-stats-hover (P2 — hover overlay présence%/séances/groupes + cache + fn SQL — dépend 49-6)
- [ ] 57-7 : implantations-score-sante-academie (P2 — score présence×0.6 + maîtrise×0.4 + badge vert/or/rouge + tests — dépend 57-5)
- [ ] 57-4 : implantations-carte-leaflet-terrain (P3 — mini-carte Leaflet + lien Google Maps — dépend 49-6)
- [ ] 57-6 : implantations-comparaison-cote-a-cote (P3 — page /implantations/compare split-view — dépend 57-5 + 57-7)

**Dépendances** :
- Toutes les stories dépendent de 49-6 `done` (ImplantationDetail + photo_url + ImplantationCard redesignée)
- 57-2 et 57-3 partagent la migration `max_players` (00117) — implémenter 57-2 en premier
- 57-5 requiert la migration fn SQL `00118` (hover stats)
- 57-6 dépend de 57-5 (compareImplantations = 2× getImplantationHoverStats)
- 57-7 dépend de 57-5 (masteryRatePct dans ImplantationHoverStats)
- Migrations : 00117 (max_players), 00118 (fn hover stats), 00119 (fn compare stats)

---

### Epic 58 — Méthodologie "Tactical Notebook"

Ordre d'implémentation recommandé (dépendances en cascade) :

- [ ] 58-6 : methodologie-notation-difficulte-etoiles (P1 — migration 00121 + StarRating @aureak/ui + filtre liste — dépend Epic 20)
- [ ] 58-1 : methodologie-situation-card-hearthstone (P1 — SituationCard @aureak/ui + grille situations — dépend Epic 20 + 58-6 optionnel)
- [ ] 58-4 : methodologie-theme-semaine-tile (P2 — tile hub méthodo rotation ISO week — dépend Epic 20)
- [ ] 58-8 : methodologie-modules-3-phases-timeline (P2 — timeline Activation/Développement/Conclusion + fiche séance — dépend migration 00111)
- [ ] 58-3 : methodologie-drag-situation-vers-seance (P2 — drag HTML5 SituationCard → drop zone séance — dépend 58-1)
- [ ] 58-7 : methodologie-recommandations-groupe (P2 — fn SQL avg level + getRecommendedSituations + wizard — dépend 58-1 + 58-6)
- [ ] 58-5 : methodologie-qr-code-exercice (P3 — qrcode.js modal + imprimer — dépend Epic 20)
- [ ] 58-2 : methodologie-terrain-editeur-svg (P3 — TacticalEditor SVG drag joueurs + flèches + migration 00120 — dépend Epic 20)

**Dépendances** :
- Toutes les stories dépendent d'Epic 20 `done` (méthodologie CRUD, `MethodologySituation`, `methodology_situations` table)
- 58-6 à implémenter avant 58-1 (SituationCard utilise `difficultyLevel`)
- 58-3 dépend de 58-1 (`draggable` prop sur `SituationCard`)
- 58-7 dépend de 58-1 (`isRecommended` prop) et de 58-6 (`difficultyLevel`)
- 58-8 dépend de la migration `00111_methodology_sessions_modules.sql` (`done` selon MEMORY)
- Migrations : 00120 (diagram_json), 00121 (difficulty_level), 00122 (fn group avg level)

---

### Epic 59 — Gamification XP & Achievements

> Ordre d'implémentation recommandé : 59-1 (fondation) → 59-4 (badges) → 59-2 (animation) → 59-3 (leaderboard) → 59-6 (score académie) → 59-9 (toasts RT) → 59-5 (quêtes coaches) → 59-7 (milestones) → 59-8 (profil admin) → 59-10 (trophée)
> Migrations : 00118 (xp_ledger + progression), 00119 (badges_definitions), 00120 (coach_quests), 00121 (academy_milestones)

- [ ] 59-1 : gamification-migration-xp-ledger-edge-function-award-xp (P0 — fondation, migration 00118 + Edge Function award-xp)
- [ ] 59-4 : gamification-20-badges-definitions-ui-grid (P1 — migration 00119, BadgeGrid amélioré, intégration fiche joueur)
- [ ] 59-2 : gamification-levelup-animation-spring-flash-or (P1 — LevelUpAnimation + useLevelUp, CSS spring 0.8s)
- [ ] 59-3 : gamification-leaderboard-academie-top10 (P1 — podium or/argent/bronze, évolution hebdo, tile dashboard)
- [ ] 59-6 : gamification-score-academie-global-kpi (P1 — KPI composite présence+progression+activité, tile hero dashboard)
- [ ] 59-9 : gamification-achievement-toast-realtime (P1 — Supabase Realtime, AchievementToast, FIFO queue)
- [ ] 59-5 : gamification-quetes-hebdomadaires-coaches (P2 — migration 00120, 5 quêtes coaches, fiche coach)
- [ ] 59-7 : gamification-celebration-milestone-academie (P2 — migration 00121, confetti CSS pur, MilestoneCelebration)
- [ ] 59-8 : gamification-profil-manager-admin-level-xp (P2 — route profile, barre XP, badges admin, lien sidebar)
- [ ] 59-10 : gamification-season-trophy-fin-saison (P2 — SeasonTrophy SVG paramétrique, export PNG canvas natif)

---

### Epic 60 — Analytics "Stats Room"

> Migration 60-6 : numéro à confirmer à l'implémentation (00121+ selon numérotation disponible après Epics 58/59)

Ordre d'implémentation recommandé : 60-1 → 60-5 → 60-2 → 60-3 → 60-4 → 60-6 → 60-8 → 60-7

- [ ] 60-1 : analytics-stats-room-landing-hub (P1 — hub 4 sections cliquables + KPIs globaux + sous-routes placeholder)
- [ ] 60-5 : analytics-color-coded-stats-universels (P1 — getStatColor + STAT_THRESHOLDS dans @aureak/theme — util transversal)
- [ ] 60-2 : analytics-chart-presences-12-mois (P2 — LineChart SVG pur, multi-groupes, hover tooltip — dépend 60-1)
- [ ] 60-3 : analytics-heatmap-jours-heures (P2 — HeatmapGrid 7×24 couleurs intensité — dépend 60-1)
- [ ] 60-4 : analytics-classement-implantations-bar-chart (P2 — BarChart horizontal, tri, couleur performance — dépend 60-1)
- [ ] 60-6 : analytics-top10-joueurs-classements (P2 — podium top 3, flèches évolution, 3 métriques, vue SQL — dépend 60-1 + 60-5)
- [ ] 60-8 : analytics-live-counters-realtime (P2 — LiveCounter Supabase Realtime, fallback polling 30s — dépend 60-1)
- [ ] 60-7 : analytics-export-rapport-pdf-mensuel (P3 — jspdf, rapport A4, modale options — dépend 60-2 + 60-4 + 60-6)

**Dépendances** :
- 60-1 : indépendant (refacto analytics/index.tsx + nouvelles sous-routes)
- 60-5 : indépendant (util pur @aureak/theme)
- 60-2/60-3/60-4 : dépendent de 60-1 (sous-routes créées)
- 60-6 : dépend de 60-1 + requiert migration vue SQL rankings
- 60-7 : dépend de 60-2/60-4/60-6 (données à inclure dans le PDF)
- 60-8 : indépendant techniquement, intégré dans dashboard + analytics

---

### Epic 61 — Mobile & Dark Mode

Ordre d'implémentation recommandé : 61-1 → 61-6 → 61-3 → 61-2 → 61-5 → 61-4

- [ ] 61-1 : mobile-dark-mode-coach-terrain-auto (P1 — tokens dark.*, ThemeContext, auto-switch < 768px)
- [ ] 61-6 : mobile-splash-screen-anime (P1 — SplashScreen isAppReady, SVG terrain draw, fade-out 300ms)
- [ ] 61-3 : mobile-pwa-install-banner (P2 — beforeinstallprompt, Safari instructions, localStorage counter — web uniquement)
- [ ] 61-2 : mobile-hud-seance-active (P2 — ActiveSessionHUD + ActiveSessionContext + Realtime présences — dépend 61-1)
- [ ] 61-5 : mobile-offline-mode-cache-du-jour (P2 — AsyncStorage cache + offlineQueue + OfflineBanner + sync reconnexion)
- [ ] 61-4 : mobile-swipe-gestures-presences (P3 — SwipeableRow + useSwipeGesture + optimistic update — mobile uniquement)

**Dépendances** :
- 61-1 : indépendant (extension tokens.ts + ThemeContext)
- 61-2 dépend de 61-1 (ThemeContext isMobile pour condition affichage HUD)
- 61-3 indépendant (web uniquement, pas de dépendance thème)
- 61-4 indépendant techniquement (gestures séances)
- 61-5 indépendant (cache/queue/offline)
- 61-6 indépendant (splash dans _layout.tsx)

---

### Epic 62 — Polish & Micro-interactions

Ordre d'implémentation recommandé : 62-6 → 62-3 → 62-2 → 62-1 → 62-4 → 62-5

- [ ] 62-6 : polish-favicon-pwa-manifest (P1 — favicon SVG ballon or + manifest.json + balises head — assets statiques)
- [ ] 62-3 : polish-skeleton-loading-uniforme (P1 — Skeleton.tsx @aureak/ui + shimmer + dark mode + usage clubs/stages/analytics)
- [ ] 62-2 : polish-empty-states-illustres-svg (P2 — EmptyState 6 variantes SVG gold/blanc + animation float)
- [ ] 62-1 : polish-micro-interactions-check-save-error (P2 — useMicroInteraction bounce/flash/shake + prefers-reduced-motion)
- [ ] 62-4 : polish-tooltips-educatifs-contextuels (P2 — HelpTooltip popover accessible + helpTexts.ts Aureak)
- [ ] 62-5 : polish-transitions-page-animees-expo-router (P3 — @keyframes page-enter + usePathname + prefers-reduced-motion)

**Dépendances** :
- 62-6 : entièrement indépendant (assets statiques + balises head)
- 62-3 : indépendant (nouveau composant @aureak/ui, améliore pages existantes)
- 62-2 : indépendant (nouveau composant @aureak/ui EmptyState)
- 62-1 : indépendant (hook useMicroInteraction + props Button)
- 62-4 : indépendant (composant HelpTooltip)
- 62-5 dépend de 61-1 (usePathname) et profite de 61-1 (ThemeContext) — peut être développé seul

---

### Epic 63 — Navigation refactoring orientée usage

Objectif : sidebar 7 items max, logique métier (pas technique), section Évènements unifiée, section Développement.

Ordre d'implémentation : 63-1 → 63-2 → 63-3

- [ ] 63-1 : refactoring-sidebar-admin-nav (P1 — 7 groupes, renommages, ⚙️ Admin caché, stubs Développement)
- [ ] 63-2 : evenements-unifies-vue-filtree (P2 — migration event_type, vue /evenements filtrée, 5 types)
- [ ] 63-3 : section-developpement-prospection-marketing (P3 — hub + 3 pages stub KPIs)

**Dépendances** :
- 63-1 : indépendant (modification _layout.tsx uniquement)
- 63-2 : dépend de 63-1 (sidebar doit pointer vers /evenements)
- 63-3 : dépend de 63-1 (sidebar "Développement" créée en 63-1)

---

### Epic 64 — Bugfix batch avril 2026 #3

Correctifs issus du B-Patrol / W-Patrol du 2026-04-06.

Ordre d'implémentation recommandé : 64-1 (DB-only, 5 min) → 64-2 (UI simple) → 64-3 (grep+fix) → 64-4 (API+UI)

- [ ] 64-1 : b-patrol-01-push-migration-v-club-gardien-stats (P0 — `supabase db push` migration 00113 manquante en remote, page /clubs erreur 400)
- [ ] 64-2 : b-patrol-02-stages-index-etats-contradictoires (P1 — bannière erreur + empty state simultanés dans /stages → logique if/else exclusive)
- [ ] 64-3 : b-patrol-03-react-unexpected-text-node-seances (P1 — warning "Unexpected text node" × 2 dans /seances → supprimer/wrapper text nodes nus)
- [ ] 64-4 : w-patrol-01-uuids-bruts-liste-presences (P1 — UUIDs affichés dans liste présences → JOIN profiles(display_name) + fallback "Joueur inconnu")

**Dépendances** :
- 64-1 : entièrement indépendant (DB push uniquement)
- 64-2 : entièrement indépendant (UI logique conditionnelle)
- 64-3 : entièrement indépendant (JSX fix)
- 64-4 : entièrement indépendant (API select + UI display)

---

## Chantier parallèle — DB Baseline Recovery

> Ne bloque pas le développement immédiat. À traiter en parallèle.

**Problème** : ~30 tables existent en remote Supabase sans migration dans le repo. Si la DB est recréée from scratch, elle sera incomplète.

**Objectif** : rendre la base recréable à 100% depuis `supabase/migrations/`.

**Étapes** :
1. Dumper le schéma remote : `supabase db dump --linked --schema public > /tmp/remote_schema.sql`
2. Identifier les tables/fonctions sans migration correspondante
3. Reconstituer les migrations manquantes (numérotées 00090+, intercalées logiquement)
4. Valider avec `supabase db reset` + `supabase db diff` = clean

---

## Migrations à créer (ordre priorité)

| Migration | Contenu | Pour story |
|-----------|---------|------------|
| `00090_rls_policies_complete.sql` | functions helpers durcies + toutes policies + coach_access_grants | 2-2, 2-3 |
| `00091_grade_content_permissions.sql` | table + RLS | 11-2 |
| `00092_support_tickets.sql` | table + RLS | 7-4 |
| `00093_user_consents.sql` | table + RLS | 10-2 |
