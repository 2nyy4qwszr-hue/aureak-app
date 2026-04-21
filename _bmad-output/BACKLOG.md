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

### Epic 8 — Quiz & Apprentissage (complément coach)

- [x] 8-6 : vue-coach-resultats-quiz-fiche-seance (P1 FEATURE — section "Résultats Quiz" dans `/seances/[sessionId]` après Présences : tableau joueurs × score + taux maîtrise par thème, `listGroupQuizResults(sessionId)` dans `@aureak/api-client` — FR24/FR72 — aucune migration)

**Dépendances** : 8-1 et 8-2 `done` (tables `learning_attempts`, `themes`, `profiles` en base). Aucune migration DB requise.

---

### Epic 76 — Bugfix API-client séances (avril 2026)

- [x] 76-1 : bug-listattendancesbychild-filtres-gte-lte-table-jointe (P1 BUG — filtres .gte/.lte sur `sessions.scheduled_at` ignorés par PostgREST → toutes les attendances retournées sans filtre de date → corriger via filtrage JS post-fetch — `api-client/src/sessions/attendances.ts`)

**Dépendances** : aucune migration DB requise. Fichier unique modifié.

---

### Epic 77 — Design Tokens Polish — Typography (avril 2026)

Remplacement des chaînes hardcodées restantes après le batch 75.x.
Aucune migration DB — UI uniquement.

- [x] 77-1 : design-evaluations-tokens-fontfamily-hex (P1 DESIGN — 4× `'Montserrat'` → `fonts.body` + `'#1c1c17'` → `colors.text.dark` dans `evaluations/page.tsx` — zéro valeur hardcodée après story 75.4)
- [x] 77-2 : ux-children-recherche-live-debounce (P2 UX — debounce 300ms sur champ recherche /children, suppression bouton "Chercher", clear immédiat sur ✕ — `children/index.tsx` uniquement, zéro changement API)
- [x] 77-3 : design-implantations-tokens-terrain-gradient-blanc (P1 DESIGN — 2× gradients `#1a472a`/`#2d6a4f` → `TERRAIN_GRADIENT_DARK` + 10× `'#FFFFFF'` → `colors.text.primary` dans `implantations/index.tsx`)
- [x] 77-4 : design-analytics-hex-hardcodes-tokenisation (P1 DESIGN — `#3B82F6` CLUBS_BLUE → `colors.status.info` + `#F59E0B` CHARGE_AMBER → `colors.status.warning` dans `analytics/page.tsx` ; `#C0C0C0` SILVER → `colors.accent.silverPodium` (nouveau token) + `#CD7F32` BRONZE → `colors.accent.bronze` dans `analytics/progression/page.tsx`)
- [x] 77-5 : bug-vue-session-evaluations-merged-absente-migrations (HIGH BUG — vue `session_evaluations_merged` absente de `supabase/migrations/` → requêtes 406 sur toutes les pages Évaluations — 1 migration `CREATE OR REPLACE VIEW` uniquement, zéro changement api-client) `done`

**Dépendances** : dépend de 75.4 (done) — ne pas réintroduire Manrope ni #7C3AED.

---

### Epic 78 — Module Tickets Parent/Admin — Complétion web (avril 2026)

Complétion du module tickets issu de story 7.4 (done) : page détail parent manquante + soft-delete RGPD.

- [x] 78-1 : tickets-parent-detail-softdelete (P1 FEATURE — page `/parent/tickets/[ticketId]` fil réponses + réponse parent + fermeture douce ; migration 00143 `deleted_at` sur `tickets` ; `softDeleteTicket()` API — FR31/FR32)

**Dépendances** : story 7.4 done (tables `tickets`/`ticket_replies`, API de base, pages admin et liste parent).

---

### Epic 65 — Activités Hub Unifié (Séances · Présences · Évaluations)

- [x] 65-1 : activites-seances-refonte-hub-tableau (P1 — route /activites, tableau séances avec pseudo-filtres temporels, stat cards, colonnes Statut/Date/Méthode/Groupe/Coach/Présence/Badges/K/C/Anomalie)
- [x] 65-2 : activites-presences-vue-transversale (P1 — onglet Présences, vue groupes×séances en Global, heatmap joueurs×séances en Groupe, section À surveiller — dépend 65-1)
- [x] 65-3 : activites-evaluations-vue-transversale (P2 — onglet Évaluations, 3 sous-filtres Badges/Connaissances/Compétences, grille badges joueurs, placeholders futurs modules — dépend 65-1)
- [x] 65-4 : ux-filtresscope-pill-groupe-disabled — CANCELLED (superseded par 65-8, Jeremy ne veut pas du hint textuel)
- [x] 65-5 : tableau-seances-methode-coach-enrichi (P1 bug — colonnes MÉTHODE et COACH toujours vides, enrichir listSessionsWithAttendance avec JOIN methodology_sessions+session_coaches, brancher MethodeBadge et CoachAvatars — dépend 65-1)
- [x] 65-6 : presences-vue-joueur-inline (P1 UX fix — supprime router.push auto sur scope Joueur, remplace par card résumé joueur + timeline 10 séances + stats 30j/totale + lien opt-in fiche complète — dépend 65-2)
- [x] 65-7 : bug-recordattendance-recordedby-vide (P1 BUG — recordedBy: '' → user.id, import useAuthStore manquant — fiche séance /seances/[sessionId])
- [x] 65-8 : ux-activites-polish-filtres-zindex-empty-state (P2 — filtres côte à côte, z-index dropdowns, empty state clair, autocomplete off, retrait hint groupe)
- [x] 65-9 : ux-seances-navigation-retour-defaut (P3 — bouton retour fiche séance, filtre par défaut Aujourd'hui, unsaved changes confirmation)

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

- [x] 50-1 : dashboard-hero-band-salle-de-commandement (P1 — bandeau 160px #2A2827, logo AUREAK, date/heure, texture terrain SVG)
- [x] 50-2 : dashboard-kpi-cards-sparkline-delta (P1 — SparklineSVG 6 semaines + DeltaPill ▲▼ — dépend 50-1)
- [x] 50-3 : dashboard-prochaine-seance-countdown-tile (P1 — countdown H:MM:SS, card or, API listUpcomingSessions)
- [x] 50-4 : dashboard-implantation-card-terrain-premium (P2 — header dégradé vert, badge joueurs or, chips groupes scroll)
- [x] 50-7 : dashboard-anomalies-inline-compactes (P2 — pills cliquables → modale résolution, mise à jour optimiste)
- [x] 50-8 : dashboard-widget-meteo-terrain (P2 — Open-Meteo API, cache 1h localStorage, recommandation extérieur)
- [x] 50-5 : dashboard-live-activity-feed (P2 — colonne droite, Supabase Realtime channel, 20 events max)
- [x] 50-6 : dashboard-forme-du-moment-tile (P2 — top 3 streaks ≥5 séances, initiales avatar, API getTopStreakPlayers)
- [x] 50-9 : dashboard-focus-mode-plein-ecran (P3 — position:fixed, masque sidebar/topbar, Escape pour quitter)
- [x] 50-10 : dashboard-tiles-kpi-reorganisables (P3 — DnD HTML5 natif, ordre localStorage, bouton reset)
- [x] 50-11 : dashboard-v2-refonte-layout-trois-zones (P1 — suppression Hero Band + feed latéral, Zone 1 Briefing du jour avec date card + implantations, Zone 2 KPIs, Zone 3 Gamification)

**Dépendances** :
- 50-2 dépend de 50-1 (Hero Band — bouton ⛶ partagé)
- 50-9 dépend de 50-1 (bouton ⛶ dans le Hero Band)
- 50-5 nécessite l'export du client Supabase depuis `@aureak/api-client`
- 50-3 et 50-6 nécessitent de vérifier le nom exact des tables `sessions` et `attendance_records`
- 50-11 intègre et remplace 50-1/50-4/50-5 (Hero Band, ImplantationCard premium, feed latéral) — UI only, aucune migration
- Migration max utilisée : aucune (Epic 50 = UI uniquement, pas de migration DB nécessaire)

---

### Epic 66 — Navigation & Sidebar Polish

- [x] 66-1 : ux-sidebar-restructuration-labels-items (P2 — "Tableau de bord"→"Dashboard", retrait Séances/Présences/Évaluations du sidebar, "Académie"→"Méthode", "Structure"→"Académie", retrait notification, fix icônes collapsed)
- [x] 66-2 : ux-sidebar-stages-sous-item-evenements-badge-actifs (P2 — ajout item "Stages" sous Évènements, route /stages, NavBadge doré count stages en_cours au mount — _layout.tsx uniquement)

---

### Epic 76 — UX Séances Quick Wins

Correctifs UX rapides sur la page séances — aucune migration DB, aucun changement API.

- [x] 76-1 : ux-seances-empty-state-toutes-vues (P1 — empty state CTA "Créer une séance" affiché sur TOUTES les vues quand filteredSessions.length === 0 — seances/page.tsx ligne 808 uniquement)

---

### Epic 70 — Dashboard Polish post-67.1 (alignement design-ref)

Micro-ajustements du dashboard après l'implémentation du layout 3 colonnes (story 67-1).
Toutes les stories portent sur `dashboard/page.tsx` uniquement — aucune migration DB.
Référence visuelle : `_bmad-output/design-references/dashboard-redesign.png`

- [x] 70-1 : design-dashboard-topbar-bandeau-plat-seance-soir (P1 — topbar sans card flottante + infos prochaine séance du soir)
- [x] 70-2 : design-dashboard-academie-titre-visible-sans-filtres (P1 — titre L'ACADÉMIE lisible + supprimer filtres Implantation/Période)
- [x] 70-3 : design-dashboard-stats-couleur-doree-uniforme (P2 — Joueurs/Coachs/Groupes/Sites tous en colors.accent.gold)
- [x] 70-4 : design-dashboard-activite-4sem-compact (P2 — padding réduit, card moins haute)
- [x] 70-5 : design-dashboard-layout-proportions-performance-large (P2 — col droite 240→280px, titre PERFORMANCE lisible, XP scores plus grands)
- [x] 70-6 : design-dashboard-score-academie-mini-stats-sans-debordement (P2 — overflow hidden + mini-tiles compactées)
- [x] 70-7 : feature-dashboard-quetes-actives-col-performance (P2 — bloc Quêtes actives entre XP et Score Académie, placeholder statique)

**Dépendances** : toutes indépendantes entre elles, toutes sur `dashboard/page.tsx`

---

### Epic 72 — Design Figma Alignment (Dashboard + Activités + Méthodologie)

Alignement visuel précis des pages principales sur les maquettes Figma validées.
Référence : `https://www.figma.com/design/HFoTEXwV01khcWelhoUtD1/Aureak-app-with-claude`
Aucune migration DB — UI uniquement.

- [x] 72-1 : design-dashboard-sessions-sites-evenements (P2 — carte "Sessions du jour" format liste + tableau "Performance Sites" + section "Prochains événements" avec CTA — dashboard/page.tsx)
- [x] 72-2 : design-statcards-seances-bento-figma (P2 — 4 stat cards bento : image icon top-left, valeur Space Grotesk Bold 30px, 4ème card fond dark gold #6e5d14 — activites/components/StatCards.tsx)
- [x] 72-3 : design-presences-statcards-heatmap-figma (P2 — labels MOYENNE GÉNÉRALE / GROUPES SOUS 70% / TOTAL SÉANCES / TENDANCE GLOBAL + seuils heatmap 90/70/60 + cellules 48×48 — activites/presences/page.tsx)
- [x] 72-4 : design-evaluations-cercles-notes-avatars-figma (P2 — composant NoteCircle gold/grey + PlayerAvatar initiales + 4 stat cards correct labels — activites/evaluations/page.tsx)
- [x] 72-5 : design-methodologie-entrainements-statcards-bento (P2 — 4 stat cards bento : SÉANCES TOTAL / AVEC THÈME / SITUATIONS / COACHS ACTIFS — methodologie/seances/index.tsx)
- [x] 72-6 : bug-alpha-colors-avatars-coach-hors-charte (P1 BUG — remplacer les couleurs d'avatars coach hors charte (violet #8B5CF6, bleu #3B82F6) par une palette AUREAK-conforme rotative (gold/vert/rouge/orange/gris) — activites/components/TableauSeances.tsx) `done`
- [x] 72-7 : bug-text-natif-evenements-aureaktext (P0 BUG — remplacer les `<Text>` natifs React Native (pills, filtres, empty state) par `<AureakText>` pour garantir la police Montserrat — evenements/page.tsx)
- [x] 72-8 : bug-couleurs-hardcodees-activites-header-presences (P1 BUG — remplacer `#18181B` par `colors.text.dark` et `#FFFFFF` par `colors.light.surface`/`colors.text.primary` dans ActivitesHeader.tsx et presences/page.tsx) `done`
- [x] 72-9 : design-geist-montserrat-dashboard (P1 DESIGN — remplacer les 57 occurrences de 'Geist, sans-serif' par 'Montserrat, sans-serif' dans dashboard/page.tsx — charte typographique AUREAK)
- [x] 72-10 : bug-load-sans-await-dashboard (P1 BUG — `load()` appelé sans `await` dans `handlePresetChange` et `handleApplyCustom` → race condition sur les appels dashboard — dashboard/page.tsx) `done`
- [x] 72-11 : bug-couleurs-hardcodees-fiche-seance-tokens (P1 BUG — HEADER_BG #1A1A1A → colors.dark.surface ; badge trial #6366F1 → colors.status.info ; presenceColor hex → tokens sémantiques ; bandeaux retard/succès/erreur hex → tokens — seances/[sessionId]/page.tsx) `done`
- [x] 72-12 : design-dashboard-tokens-couleur-texte-dark (P2 POLISH — 2× `colors.text.primary` dans date-card dark → `colors.dark.text` (sémantique correcte) + commentaires documentation hero cards dark intentionnelles Story 50-11 — dashboard/page.tsx) `done`
- [x] 72-13 : design-presences-card-tendance-light-border-gold (P2 DESIGN — card "Tendance Global" fond sombre goldDark → fond blanc colors.light.surface + borderColor colors.accent.gold ; textes adaptés pour fond blanc — activites/presences/page.tsx) `done`
- [x] 72-14 : bug-type-color-performance-manquant-seances (P1 BUG — `TYPE_COLOR` dans `seances/_components/constants.ts` et `typeMap`/`methodLabel` dans `dashboard/seances/page.tsx` manquent l'entrée `performance` → affichage gold par défaut au lieu de teal #26A69A — 2 fichiers, 3 lignes) `done`

**Dépendances** : toutes indépendantes entre elles

---

### Epic 71 — Activités Polish (alignement design-refs)

Micro-ajustements des pages Activités après les stories 67-2 et 67-3.
Références visuelles : `_bmad-output/design-references/Activites *-redesign.png`
Aucune migration DB — UI uniquement.

- [x] 71-6 : bug-activitesheader-hrefs-onglets-incorrects (P0 BUG — onglets Présences/Évaluations redirigent vers /implantations et /children — 2 lignes ActivitesHeader.tsx)
- [x] 71-3 : bug-breadcrumb-visible-sous-pages-activites (P1 BUG — breadcrumb affiché sur /activites/presences et /activites/evaluations — supprimer via condition pathname dans _layout.tsx)
- [x] 71-1 : design-statcards-seances-pictos-ordre-4eme-card-doree (P2 — picto→label→valeur + 4ème card fond dark + progress bar gold)
- [x] 71-2 : design-statcards-presences-evaluations-pictos-4eme-card-dark (P2 — même template picto que 71-1 pour Présences et Évaluations)
- [x] 71-4 : design-header-activites-fond-uniforme (P3 — aligner fond page + header sur colors.light.surface + onglets inactifs en colors.text.dark)
- [x] 71-5 : design-tableau-seances-badges-statut-plus-contraste (P3 — fonds badges STATUS plus denses + fontWeight 700)

**Dépendances** : 71-1 avant 71-2 (pattern commun) — les autres indépendantes

---

### Epic 67 — Design References — Redesign visuel (Dashboard + Activités)

Refonte visuelle basée sur les références images validées par Jeremy.
Répertoire : `_bmad-output/design-references/`
Aucune migration DB — UI uniquement. Données de l'app conservées.

- [x] 67-1 : design-dashboard-refonte-3-colonnes (P1 — layout 3 colonnes La Journée/L'Académie/Performance remplaçant les 3 zones verticales actuelles — référence `dashboard-redesign.png`)
- [x] 67-2 : design-activites-seances-redesign-visuel (P2 — stat cards 28px bold + tableau lignes 52px + header 10px uppercase + avatars coach 28px — référence `Activites seances-redesign.png`)
- [x] 67-3 : design-activites-presences-evaluations-harmonisation-tableau (P2 — harmoniser Présences heatmap + Évaluations tableau sur le style de 67-2 — fond blanc, pas de sombre — dépend 67-2)

---

### Epic 68 — Design Méthodologie Entraînements

Refonte visuelle de la page Entraînements basée sur la référence `Methodologie entrainement-redesign.png`.
Aucune migration DB — les 7 méthodes sont déjà dans `@aureak/types` et `@aureak/theme`.

- [x] 68-1 : design-methodologie-entrainements-refonte-tableau-pictos-methodes (P2 — tableau à la place de la grille, 7 stat cards méthodes avec pictos ⚽📚📐🎯💪🧠👥, header MÉTHODOLOGIE + onglets, colonnes METHODE/NUM/TITRE/THÈMES/SITUATIONS/PDF/STATUT)

---

### Epic 69 — UX Polish & Quick Wins

Aucune migration DB — UI uniquement. Petits correctifs et améliorations UX rapides.

- [x] 69-1 : ux-skeleton-fiche-seance (P1 — skeleton loading fiche séance remplace texte "Chargement…")
- [x] 69-2 : bug-label-en-cours-stages (P1 BUG — "En_cours" → "En cours" mapping label statut)
- [x] 69-3 : ux-skeleton-hub-methodologie (P2 — skeleton complet tile Thème semaine, zéro layout shift)
- [x] 69-4 : ux-empty-state-cta-themes-situations (P2 — bouton CTA dans empty state Thèmes + Situations)
- [x] 69-5 : ux-stepper-wizard-nouvelle-seance (P2 — stepper 6 étapes visible dans /seances/new)
- [x] 69-11 : ux-confirm-delete-bloc-journee-stage (P1 UX — ConfirmDialog avant suppression bloc (l.640) et journée (l.550) dans stages/[stageId]/page.tsx — pattern clubs/[clubId]/page.tsx)

---

### Epic 52 — Player Cards Ultimate Squad

Ordre d'implémentation recommandé (dépendances en cascade) :

- [x] 52-1 : player-card-fut-style (P1 — composant PlayerCard 160×220px tiers visuels — `@aureak/ui`)
- [x] 52-2 : stats-gardien-6-attributs (P1 — PLO/TIR/TEC/TAC/PHY/MEN + computePlayerTier — dépend 52-1)
- [x] 52-4 : toggle-galerie-liste (P1 — vue grille cards vs liste, localStorage — dépend 52-1)
- [x] 52-5 : filtres-tier-pills (P1 — pills colorées multi-sélection — dépend 52-2 + 52-4)
- [x] 52-6 : header-photo-fullwidth (P1 — header 280px + tabs fiche joueur — dépend 52-1)
- [x] 52-3 : shimmer-animation-elite (P2 — @keyframes CSS bordure Elite — dépend 52-1 + 52-2)
- [x] 52-7 : xp-bar-animee (P2 — XPBar Animated.Value, composant @aureak/ui — dépend 52-6)
- [x] 52-9 : badges-collection (P2 — BadgeGrid 10 badges statiques — dépend 52-6)
- [x] 52-10 : radar-chart-svg (P2 — RadarChart SVG pur 6 axes — dépend 52-2)
- [x] 52-8 : card-evolution-animation (P3 — flip+flash level up — dépend 52-6 + 52-2)
- [x] 52-12 : vue-master-detail (P2 — split-screen desktop liste+fiche — dépend 52-4 + 52-6)
- [x] 52-11 : export-card-png (P3 — html2canvas PNG + Web Share API — dépend 52-1 + 52-6)

---

### Epic 53 — Séances "Training Ground"

Ordre d'implémentation recommandé (dépendances en cascade) :

- [x] 53-1 : seances-vue-semaine-tactical-board (P1 — grille slots colorés par méthode + charge hebdo — WeekView.tsx)
- [x] 53-2 : seances-fiche-header-match-report (P2 — header premium dark + stripe or + badge méthode grand format)
- [x] 53-3 : seances-intensite-indicator (P2 — barre 5 niveaux ⬤⬤⬤⬤○ or/rouge — migration + API updateSessionIntensity)
- [x] 53-4 : seances-selecteur-methode-tuiles (P2 — grandes tuiles icône+couleur remplaçant le dropdown)
- [x] 53-5 : seances-duplication-rapide (P2 — bouton Dupliquer → prefill query params dans new.tsx)
- [x] 53-6 : seances-rapport-post-entrainement (P2 — section Résumé sur séance réalisée : présence%, note moy., top joueur)
- [x] 53-7 : seances-badge-serie-sans-absence (P3 — badge fire sur joueurs avec 5+ présences consécutives)
- [x] 53-8 : seances-season-planner (P3 — nouvelle page /seances/planner grid 5 semaines × groupes)
- [x] 53-9 : seances-filtres-presets-enregistrables (P3 — pills présets sauvegardés localStorage)
- [x] 53-10 : seances-coaches-drag-drop (P3 — DnD HTML5 natif zones Disponibles/Assignés)

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

- [x] 54-1 : presences-squad-overview (P1 — grille 4 colonnes cartes joueurs avec statut — remplace liste verticale 49-4)
- [x] 54-2 : presences-toggle-neumorphique (P2 — composant AttendanceToggle dans @aureak/ui, shadow inset spring 150ms)
- [x] 54-3 : presences-streak-joueur-affiche (P2 — sous-texte streak par joueur — batch API getGroupMembersRecentStreaks)
- [x] 54-4 : presences-zone-retardataires (P2 — section séparée joueurs status='late' + bouton → Présent)
- [x] 54-5 : presences-validation-groupee (P2 — bouton Tous présents + Promise.allSettled + micro-confetti)
- [x] 54-6 : presences-heatmap-mensuelle-joueur (P2 — composant AttendanceHeatmap dans @aureak/ui + section fiche joueur)
- [x] 54-7 : presences-alertes-absence-pattern (P2 — inline dans recordAttendance, inapp_notifications, bandeau orange)
- [x] 54-8 : presences-export-pdf-hebdomadaire (P3 — window.print() + HTML report builder + bouton vue Semaine)

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

- [x] 49-4 : ux-presences-liste-enfants-groupe (P1 — toggle présent/absent pré-rempli pour tous les joueurs du groupe)
- [x] 49-2 : ux-blocs-themes-editables-fiche-seance (P2 — section thèmes non éditable post-création)
- [x] 49-5 : design-dashboard-game-manager-premium (P2 — hero band, sparkline KPIs, ImplantationCard terrain, next session tile)
- [x] 49-6 : design-implantations-photo-logo-redesign (P2 — photo/logo implantation Storage + header premium + groupes cards)
- [x] 49-7 : feature-affiliation-auto-joueur-club-saison (P3 — vue SQL + affichage auto club saison courante dans fiche joueur)

### Epic 47 — Design/UX batch

- [x] 47-1 : design-sidebar-icones-navigation
- [x] 47-2 : design-implantation-visuel-photo-groupes-card
- [x] 47-3 : ux-hub-seances-unifie
- [x] 47-4 : feature-liaisons-joueurs-clubs-affiliation-saison
- [x] 47-5 : bug-sidebar-lien-groupes-404
- [x] 47-6 : design-avatars-tokens-gold (P1 — PALETTE violet/bleu hardcodée dans children/[childId]/page.tsx → tokens @aureak/theme)
- [x] 47-7 : design-gradients-tokens-dashboard (P1 — gradients verts terrain hardcodés lignes 26/640/849 dans dashboard/page.tsx → tokens @aureak/theme)
- [x] 47-8 : ux-evenements-empty-state-cta (P1 — dead-end UX : filtre Tournoi → liste vide sans CTA. Empty state dédié + CTA "Créer un Stage" + label "Bientôt disponible" dans modal)
- [x] 47-9 : ux-developpement-breadcrumb-retour (P1 — bouton retour invisible/non affordant dans sous-pages Développement → enrichir Pressable : état hover/pressed + fond `colors.light.hover` + bordure + `router.back()`)

### Epic 45 — Design System v3

- [x] 45-1 : design-system-montserrat-gamification-tokens (Montserrat + XP/niveaux/badge tokens)

### Epic 42 — Dashboard & Présences redesign

- [x] 42-1 : dashboard-bento-redesign
- [x] 42-2 : presences-redesign-visual-compact

### Epic 43 — Méthodologie UX

- [x] 43-1 : bug-delete-methodologie-seance (P1)
- [x] 43-2 : methodologie-cards-compactes
- [x] 43-3 : modules-goal-player

### Epic 44 — Bugs & UX coaching/joueurs

- [x] 44-1 : bug-edge-function-create-coach (P1)
- [x] 44-2 : bug-filtre-saison-actuelle-joueurs (P1)
- [x] 44-3 : ux-creation-coach-role-prefill
- [x] 44-4 : fiche-joueur-parents-club-liens
- [x] 44-5 : mini-stats-joueur-groupe
- [x] 44-6 : implantation-stats-enfants

### Epic 78 — Bugfix fiche enfant côté parent (avril 2026)

- [x] 78-1 : bug-evalmap-key-scheduled-at-vs-session-id (P1 BUG — `evalMap.get(att.sessions?.scheduled_at)` utilise la date string comme clé alors que la Map est indexée par `session_id` UUID → évaluations jamais affichées dans la fiche enfant parent — `apps/web/app/(parent)/parent/children/[childId]/index.tsx` ligne 290, fix en 2 lignes)

**Dépendances** : aucune migration DB requise. Fichier unique modifié.

---

### Epic 79 — Feature Dashboard Admin — Coaching Activity (avril 2026)

Widget "Coachs sans activité" dans la colonne Performance du dashboard admin.
Aucune migration DB — les tables `session_coaches`, `evaluations`, `profiles` existent déjà.

- [x] 79-1 : feature-dashboard-coachs-inactifs-widget (P1 FEATURE — card "Coachs sans activité" dans COL DROITE Performance du dashboard admin : fonction `detectInactiveCoaches()` dans `@aureak/api-client/src/admin/coaches.ts` + widget inline count + liste noms + états vide/skeleton/erreur — FR42)

**Dépendances** : aucune migration DB requise. Tables existantes : `profiles`, `session_coaches`, `sessions`, `evaluations`.

---

### Epic 80 — UX Stages Date Picker (avril 2026)

Remplacement des TextInput texte libre format AAAA-MM-JJ par des `<input type="date">` natifs HTML sur les formulaires stages. Aucune migration DB — UI uniquement.

- [x] 80-1 : ux-stages-dates-input-natif (P1 UX — `stages/new.tsx` : 2 champs dates début/fin → `input type="date"` natif + `stages/[stageId]/page.tsx` : champ "Ajouter une journée" → `input type="date"` natif — pattern existant : `coach/sessions/new/index.tsx`)

**Dépendances** : aucune migration DB requise. 2 fichiers UI modifiés.

---

### Epic 49 — Bugfix batch avril 2026 #2

- [x] 49-9 : bug-attendance-table-manquante-remote (P0 — table `attendances` absente en remote → PGRST205 dashboard + score académie cassés — migration 00136)
- [x] 49-8 : bug-dashboard-get-implantation-stats-erreur-400 (P1 — fn SQL manquante → tiles KPI vides)
- [x] 49-10 : bug-profiles-id-milestones (P1 — typo getUncelebratedMilestones + doc correctif profiles.id → user_id — MilestoneCelebration jamais affichée)
- [x] 49-11 : bug-nav-badges-session-attendees (P1 — `column session_attendees_1.status` → topbar séance active muette — remplacer session_attendees par attendances dans getActiveSession*)
- [x] 49-1 : bug-creation-coach-edge-function (P1 — non-2xx persistant malgré story 44-1)
- [x] 49-3 : bug-joueurs-club-non-visibles (P2 — section annuaire manquante dans fiche club)

### Epic 34 — Programme pédagogique

- [x] 34-1 : architecture-programme-pedagogique-formulaire-intelligent (P1)
- [x] 34-2 : navigation-programme-ux-bibliotheque (P1 — dépend 34-1)

### Epic 51 — Navigation & Shell Game HUD

> Ordre d'implémentation recommandé : 51-1 → 51-7 → 51-4 → 51-2 → 51-5 → 51-6 → 51-3 → 51-8

- [x] 51-1 : sidebar-active-state-barre-or-icones-svg (P1 — icônes SVG remplacement emojis + active state gold consolidé)
- [x] 51-7 : sidebar-collapse-smooth-animation (P2 — animation 280ms + tooltips mode collapsed — dépend 51-1)
- [x] 51-4 : notification-badges-sidebar (P2 — pastilles rouge/or présences+séances — dépend 51-1)
- [x] 51-2 : topbar-seance-active-permanente (P2 — barre gold séance en cours + polling 60s — API getActiveSession)
- [x] 51-5 : breadcrumb-anime-retour-cliquable (P2 — fil d'Ariane + BreadcrumbContext + animation 200ms)
- [x] 51-6 : raccourcis-clavier-navigation (P2 — chords G J / N S + overlay aide ? — coordonner avec 51-3)
- [x] 51-3 : command-palette-cmd-k (P3 — overlay ⌘K recherche unifiée joueurs+clubs+séances+nav)
- [x] 51-8 : dark-mode-complet-toggle-persistant (P3 — tokens dark.* + ThemeContext + toggle sidebar — dépend 51-1)

### Epic 55 — Évaluations "Player Report"

Ordre d'implémentation recommandé (dépendances en cascade) :

- [x] 55-1 : evaluations-card-fut-style-note-centrale (P1 — composant EvaluationCard FUT gold/silver/rouge, `@aureak/ui`)
- [x] 55-3 : evaluations-timeline-croissance-joueur (P1 — GrowthChart SVG ligne gradient, fiche joueur — dépend 55-1)
- [x] 55-4 : evaluations-badge-best-session-animation (P1 — BestSessionBadge spring + isPersonalBest API — dépend 55-1)
- [x] 55-6 : evaluations-filtre-joueurs-en-danger (P1 — listDangerousPlayers, alertes rouge, filtre children — dépend 55-1)
- [x] 55-2 : evaluations-radar-chart-comparaison-2-joueurs (P2 — RadarChart SVG 6 axes, page comparison — dépend 55-1)
- [x] 55-5 : evaluations-comparaison-biais-coach (P2 — tableau delta coachs, export CSV, admin only — dépend 55-1)
- [x] 55-8 : evaluations-joueur-de-la-semaine-dashboard (P2 — PlayerOfWeekTile, confetti localStorage — dépend 55-1)
- [x] 55-7 : evaluations-export-scouting-pdf (P3 — @react-pdf/renderer, ScoutingPDF A4 — dépend 55-2 + 55-3)

---

### Epic 56 — Groupes "Team Sheets Premium"

Ordre d'implémentation recommandé (dépendances en cascade) :

- [x] 56-1 : groupes-card-team-sheet-formation-visuelle (P1 — GroupCard mini-terrain SVG, grille groups/index — `@aureak/ui`)
- [x] 56-3 : groupes-player-avatars-grille-card (P1 — PlayerAvatarGrid avatars colorés tiers, intégration GroupCard — dépend 56-1)
- [x] 56-6 : groupes-capacite-indicateur-alerte (P1 — CapacityIndicator rouge/orange/neutre, max_players — dépend 56-1)
- [x] 56-5 : groupes-badge-groupe-du-mois (P2 — GroupOfMonthBadge shimmer, getTopGroupByAttendance — dépend 56-1)
- [x] 56-2 : groupes-formation-tactique-visuelle-terrain (P2 — TacticalBoard SVG 11 positions, migration 00114 — dépend 56-1)
- [x] 56-4 : groupes-drag-drop-transfer-joueur (P2 — drag HTML5, modal confirmation, transferGroupMember — dépend 56-1 + 56-3)
- [x] 56-7 : groupes-generateur-auto-groupes-par-age (P2 — GroupGeneratorModal, catégories U10/U12/U14/U17 — dépend 56-1)
- [x] 56-8 : groupes-transition-slide-fiche-joueur (P3 — slide 300ms cubic-bezier, prefers-reduced-motion — dépend 56-2)

---

### Epic 57 — Implantations "Facilities Manager"

Ordre d'implémentation recommandé (dépendances en cascade) :

- [x] 57-2 : implantations-header-detail-premium (P1 — header 280px + badge capacité + bouton éditer + gradient enrichi — dépend 49-6)
- [x] 57-3 : implantations-capacite-barre-remplissage (P1 — barre vert/or/rouge + label X/Y joueurs — dépend 49-6 + 57-2 pour max_players)
- [x] 57-1 : implantations-photo-drag-drop-premium (P2 — drag & drop + preview locale + compression 800px — dépend 49-6)
- [x] 57-8 : implantations-mini-timeline-prochaines-seances (P2 — 3 prochaines séances sur card + lien — dépend 49-6)
- [x] 57-5 : implantations-overlay-stats-hover (P2 — hover overlay présence%/séances/groupes + cache + fn SQL — dépend 49-6)
- [x] 57-7 : implantations-score-sante-academie (P2 — score présence×0.6 + maîtrise×0.4 + badge vert/or/rouge + tests — dépend 57-5)
- [x] 57-4 : implantations-carte-leaflet-terrain (P3 — mini-carte Leaflet + lien Google Maps — dépend 49-6)
- [x] 57-6 : implantations-comparaison-cote-a-cote (P3 — page /implantations/compare split-view — dépend 57-5 + 57-7)

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

- [x] 58-6 : methodologie-notation-difficulte-etoiles (P1 — migration 00121 + StarRating @aureak/ui + filtre liste — dépend Epic 20)
- [x] 58-1 : methodologie-situation-card-hearthstone (P1 — SituationCard @aureak/ui + grille situations — dépend Epic 20 + 58-6 optionnel)
- [x] 58-4 : methodologie-theme-semaine-tile (P2 — tile hub méthodo rotation ISO week — dépend Epic 20)
- [x] 58-8 : methodologie-modules-3-phases-timeline (P2 — timeline Activation/Développement/Conclusion + fiche séance — dépend migration 00111)
- [x] 58-3 : methodologie-drag-situation-vers-seance (P2 — drag HTML5 SituationCard → drop zone séance — dépend 58-1)
- [x] 58-7 : methodologie-recommandations-groupe (P2 — fn SQL avg level + getRecommendedSituations + wizard — dépend 58-1 + 58-6)
- [x] 58-5 : methodologie-qr-code-exercice (P3 — qrcode.js modal + imprimer — dépend Epic 20)
- [x] 58-2 : methodologie-terrain-editeur-svg (P3 — TacticalEditor SVG drag joueurs + flèches + migration 00120 — dépend Epic 20)

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

- [x] 59-1 : gamification-migration-xp-ledger-edge-function-award-xp (P0 — fondation, migration 00118 + Edge Function award-xp)
- [x] 59-4 : gamification-20-badges-definitions-ui-grid (P1 — migration 00119, BadgeGrid amélioré, intégration fiche joueur)
- [x] 59-2 : gamification-levelup-animation-spring-flash-or (P1 — LevelUpAnimation + useLevelUp, CSS spring 0.8s)
- [x] 59-3 : gamification-leaderboard-academie-top10 (P1 — podium or/argent/bronze, évolution hebdo, tile dashboard)
- [x] 59-6 : gamification-score-academie-global-kpi (P1 — KPI composite présence+progression+activité, tile hero dashboard)
- [x] 59-9 : gamification-achievement-toast-realtime (P1 — Supabase Realtime, AchievementToast, FIFO queue)
- [x] 59-5 : gamification-quetes-hebdomadaires-coaches (P2 — migration 00120, 5 quêtes coaches, fiche coach)
- [x] 59-7 : gamification-celebration-milestone-academie (P2 — migration 00121, confetti CSS pur, MilestoneCelebration)
- [x] 59-8 : gamification-profil-manager-admin-level-xp (P2 — route profile, barre XP, badges admin, lien sidebar)
- [x] 59-10 : gamification-season-trophy-fin-saison (P2 — SeasonTrophy SVG paramétrique, export PNG canvas natif)

---

### Epic 60 — Analytics "Stats Room"

> Migration 60-6 : numéro à confirmer à l'implémentation (00121+ selon numérotation disponible après Epics 58/59)

Ordre d'implémentation recommandé : 60-1 → 60-5 → 60-2 → 60-3 → 60-4 → 60-6 → 60-8 → 60-7

- [x] 60-1 : analytics-stats-room-landing-hub (P1 — hub 4 sections cliquables + KPIs globaux + sous-routes placeholder)
- [x] 60-5 : analytics-color-coded-stats-universels (P1 — getStatColor + STAT_THRESHOLDS dans @aureak/theme — util transversal)
- [x] 60-2 : analytics-chart-presences-12-mois (P2 — LineChart SVG pur, multi-groupes, hover tooltip — dépend 60-1)
- [x] 60-3 : analytics-heatmap-jours-heures (P2 — HeatmapGrid 7×24 couleurs intensité — dépend 60-1)
- [x] 60-4 : analytics-classement-implantations-bar-chart (P2 — BarChart horizontal, tri, couleur performance — dépend 60-1)
- [x] 60-6 : analytics-top10-joueurs-classements (P2 — podium top 3, flèches évolution, 3 métriques, vue SQL — dépend 60-1 + 60-5)
- [x] 60-8 : analytics-live-counters-realtime (P2 — LiveCounter Supabase Realtime, fallback polling 30s — dépend 60-1)
- [x] 60-7 : analytics-export-rapport-pdf-mensuel (P3 — jspdf, rapport A4, modale options — dépend 60-2 + 60-4 + 60-6)

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

- [x] 61-1 : mobile-dark-mode-coach-terrain-auto (P1 — tokens dark.*, ThemeContext, auto-switch < 768px)
- [x] 61-6 : mobile-splash-screen-anime (P1 — SplashScreen isAppReady, SVG terrain draw, fade-out 300ms)
- [x] 61-3 : mobile-pwa-install-banner (P2 — beforeinstallprompt, Safari instructions, localStorage counter — web uniquement)
- [x] 61-2 : mobile-hud-seance-active (P2 — ActiveSessionHUD + ActiveSessionContext + Realtime présences — dépend 61-1)
- [x] 61-5 : mobile-offline-mode-cache-du-jour (P2 — AsyncStorage cache + offlineQueue + OfflineBanner + sync reconnexion)
- [x] 61-4 : mobile-swipe-gestures-presences (P3 — SwipeableRow + useSwipeGesture + optimistic update — mobile uniquement)

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

- [x] 62-6 : polish-favicon-pwa-manifest (P1 — favicon SVG ballon or + manifest.json + balises head — assets statiques)
- [x] 62-3 : polish-skeleton-loading-uniforme (P1 — Skeleton.tsx @aureak/ui + shimmer + dark mode + usage clubs/stages/analytics)
- [x] 62-2 : polish-empty-states-illustres-svg (P2 — EmptyState 6 variantes SVG gold/blanc + animation float)
- [x] 62-1 : polish-micro-interactions-check-save-error (P2 — useMicroInteraction bounce/flash/shake + prefers-reduced-motion)
- [x] 62-4 : polish-tooltips-educatifs-contextuels (P2 — HelpTooltip popover accessible + helpTexts.ts Aureak)
- [x] 62-5 : polish-transitions-page-animees-expo-router (P3 — @keyframes page-enter + usePathname + prefers-reduced-motion)

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

- [x] 63-1 : refactoring-sidebar-admin-nav (P1 — 7 groupes, renommages, ⚙️ Admin caché, stubs Développement)
- [x] 63-2 : evenements-unifies-vue-filtree (P2 — migration event_type, vue /evenements filtrée, 5 types)
- [x] 63-3 : section-developpement-prospection-marketing (P3 — hub + 3 pages stub KPIs)

**Dépendances** :
- 63-1 : indépendant (modification _layout.tsx uniquement)
- 63-2 : dépend de 63-1 (sidebar doit pointer vers /evenements)
- 63-3 : dépend de 63-1 (sidebar "Développement" créée en 63-1)

---

### Epic 64 — Bugfix batch avril 2026 #3

Correctifs issus du B-Patrol / W-Patrol du 2026-04-06.

Ordre d'implémentation recommandé : 64-1 (DB-only, 5 min) → 64-2 (UI simple) → 64-3 (grep+fix) → 64-4 (API+UI)

- [x] 64-1 : b-patrol-01-push-migration-v-club-gardien-stats (P0 — `supabase db push` migration 00113 manquante en remote, page /clubs erreur 400)
- [x] 64-2 : b-patrol-02-stages-index-etats-contradictoires (P1 — bannière erreur + empty state simultanés dans /stages → logique if/else exclusive)
- [x] 64-3 : b-patrol-03-react-unexpected-text-node-seances (P1 — warning "Unexpected text node" × 2 dans /seances → supprimer/wrapper text nodes nus)
- [x] 64-4 : w-patrol-01-uuids-bruts-liste-presences (P1 — UUIDs affichés dans liste présences → JOIN profiles(display_name) + fallback "Joueur inconnu")

**Dépendances** :
- 64-1 : entièrement indépendant (DB push uniquement)
- 64-2 : entièrement indépendant (UI logique conditionnelle)
- 64-3 : entièrement indépendant (JSX fix)
- 64-4 : entièrement indépendant (API select + UI display)

---

### Epic 69 — UX Polish & Quick Wins

Petites améliorations à fort impact, indépendantes les unes des autres. Aucune migration DB.

- [x] 69-1 : ux-skeleton-fiche-seance (P1 — skeleton loading fiche séance remplace texte "Chargement…")
- [x] 69-2 : bug-label-en-cours-stages (P1 BUG — "En_cours" → "En cours" mapping label statut)
- [x] 69-3 : ux-skeleton-hub-methodologie (P2 — skeleton complet tile Thème semaine, zéro layout shift)
- [x] 69-4 : ux-empty-state-cta-themes-situations (P2 — bouton CTA dans empty state Thèmes + Situations)
- [x] 69-5 : ux-stepper-wizard-nouvelle-seance (P2 — stepper 6 étapes visible dans /seances/new)
- [x] 69-6 : ux-filtre-mes-seances-coach (P2 — toggle "Toutes/Mes séances" dans /seances, filtré sur session_coaches.coach_id)
- [x] 69-7 : feature-export-csv-joueurs (P2 — bouton export CSV dans /children, génération côté client, respect filtres)
- [x] 69-8 : feature-fiche-coach-onglet-activite (P2 — onglet Activité dans fiche coach : stats + 10 dernières séances)
- [x] 69-9 : bug-listattendancesbychild-session-date (P1 BUG — colonne session_date → scheduled_at, heatmap présences fiche joueur vide)
- [x] 69-10 : bug-checkacademymilestones-406 (P1 BUG — .single() → .maybeSingle() sur profiles, erreur 406 dashboard) ✓ done

**Dépendances** :
- 69-6 : indépendant (modifie seances/page.tsx uniquement)
- 69-7 : indépendant (modifie children/index.tsx uniquement)
- 69-8 : indépendant (modifie coaches/[coachId]/page.tsx + api-client/src/admin/coaches.ts)

---

### Epic 73 — Design Sidebar Restructuration

Nettoyage de la sidebar admin : suppression des headers de groupe redondants, renommage et simplification des items de navigation.
Aucune migration DB — UI uniquement. Fichier cible : `_layout.tsx`.

- [x] 73-1 : design-sidebar-restructuration-labels-groupes (P1 — supprimer headers DASHBOARD/ACTIVITÉ/MÉTHODE, renommer Entraînements→Méthodologie, retirer Thèmes et Situations du sidebar)
- [x] 73-2 : design-activites-fond-beige-uniforme (P1 — fond `colors.light.primary` sur header ActivitesHeader + page Séances ; Présences et Évaluations déjà corrects — ActivitesHeader.tsx + activites/page.tsx) `done`
- [x] 73-3 : design-activites-filtres-temporels-light (P1 — pills AUJOURD'HUI/À VENIR/PASSÉES : filtre actif fond `colors.accent.gold` + texte blanc, inactif fond transparent + texte muted + bordure light — PseudoFiltresTemporels.tsx)
- [x] 73-4 : design-dashboard-journee-style-uniforme (P1 — titre "LA JOURNÉE" col gauche : fontSize 10→12, colors.text.subtle→colors.text.dark, ajouter fontFamily Montserrat — aligner sur "L'ACADÉMIE" et "PERFORMANCE" — dashboard/page.tsx ligne 2725) `done`
- [x] 73-5 : design-methodologie-methodes-cards-pleine-largeur (P2 — retirer 4 bento stats cards + useMemo associés, refondre 7 cards méthodes en flex wrap pleine largeur, fond blanc uniforme sans code couleur par méthode — methodologie/seances/index.tsx) `done`
- [x] 73-6 : bug-presences-tableau-fond-beige (P1 BUG — ScrollView backgroundColor beige manquant + tri sessions par date desc dans groupPresenceRows + empty state explicite "Aucune séance trouvée" quand allDates vide — presences/page.tsx) `done`
- [x] 73-7 : bug-evaluations-tableau-fond-beige (P1 BUG — scrollContent backgroundColor beige manquant + empty state card visuel amélioré + retrait alignItems inline redondants sur colSignal — activites/evaluations/page.tsx) `done`

**Dépendances** : aucune — indépendant de tous les autres epics

---

### Epic 74 — Activités Séances : alignement référence visuelle complète

Refonte visuelle de la page Activités/Séances pour correspondre précisément à la référence `Activites seances-redesign.png` : titre, bouton CTA, filtres, stat cards. Aucune migration — UI uniquement.

- [x] 74-1 : design-activites-seances-alignement-reference-visuelle (P2 — titre 28px, bouton CTA dark, #f9e28c/#6e5d14/#FFFFFF → tokens goldDark/goldPale/text.primary, "Global"→"Toutes", violet hors charte → warning — 5 fichiers) `done`
- [x] 74-2 : bug-statcards-badges-fictifs (P1 BUG — badge "+2.4%" trend calculé réel ou masqué si données insuffisantes, badge "Record" conditionnel cancelled>0 && record mensuel — StatCards.tsx uniquement) `done`
- [x] 74-3 : bug-filtresscope-loading-boxshadow (P1 BUG — états de chargement "Chargement…" dans les 3 dropdowns Implantation/Groupe/Joueur + boxShadow rgba hardcodé → shadows.lg — FiltresScope.tsx) `done`
- [x] 74-4 : design-dashboard-gold-concatenations-tokens (P2 — `colors.accent.gold + '1f'/'40'/'14'` → `colors.border.goldBg`/`colors.border.gold` aux lignes 263/264/974 de dashboard/page.tsx — 1 fichier) `done`

**Dépendances** : aucune — indépendant de tous les autres epics

---

## Epic 75 — Bugs Patrol 2026-04-08

> Bugs détectés et corrigés lors de la patrouille du 2026-04-08. Stories créées a posteriori pour traçabilité BMAD.

- [x] 75-1 : bug-completion-status-fermee-valeur-inexistante (HIGH BUG — `completionStatus` utilisait `'fermée'` inexistant en DB → évals 0% dans StatCards — `attendances.ts:94` uniquement) `done`
- [x] 75-2 : bug-try-finally-contact-coach (HIGH BUG — `setSending` et `setLoadingHistory` sans try/finally dans `contact.tsx` — UI figée si appel API échoue — 1 fichier) `done`
- [x] 75-3 : ux-conversion-essai-membre-modale-confirmation (UX P1 — conversion silencieuse sur `groups[0]` → modale confirmation + sélecteur groupe obligatoire — `presences/page.tsx` uniquement) `done`
- [x] 75-4 : bug-evaluations-police-violet-donnees-fictives (DESIGN BLOCKER — `evaluations/page.tsx` : 4× Manrope→Montserrat, `#7C3AED` violet→token, `+2.4%`/`+15%` fictifs→dynamique ou `'—'`) `done`
- [x] 75-5 : bug-presences-heatmap-tokens-metrique-fictive (DESIGN BLOCKER — `activites/presences/page.tsx` : getCellStyle 5 hex hardcodés #22c55e/#eab308/#f97316/#ef4444/#fff → colors.status.present/attention/warning/absent/text.primary ; tendance masquée si totalSessions < 4) `done`
- [x] 75-6 : quiz-qcm-enfant-post-seance (FEATURE — UI seulement, backend 100% prêt — route `/parent/children/[childId]/quiz` — 5 questions QCM tirées des thèmes de la dernière séance, stepper mobile-friendly, résultats sauvegardés via `createLearningAttempt`/`submitAnswer`) `done`
- [x] 75-7 : quiz-qcm-parent-board-session-explicite (FEATURE — route `/parent/children/[childId]/quiz/[sessionId]` — quiz QCM depuis board parent avec session explicite, `getSessionQuiz(sessionId)`, badge trophée si ≥80%, dépend 75-6 done — FR22/FR23) `done`

**Dépendances** : aucune — toutes les tables et RPCs existent (`quiz_questions`, `session_themes`, `learning_attempts`)

---

## Epic 75 (Académie Hub) — Nav globale + Refonte Coachs

> Epic distinct de "Epic 75 — Bugs Patrol" ci-dessus. Utilise les mêmes numéros d'epic dans sprint-status.yaml (section Académie Hub).

- [x] 75-2 (Académie Hub) : academie-hub-sidebar-coachs (**P1 FEATURE** — sidebar refactor : supprime Joueurs/Coachs/Groupes/Implantations/Clubs → 1 seul item "Académie" ; hub `/academie/*` avec AcademieNavBar 6 onglets ; page `/academie/coachs` redesignée : 4 stat cards + filtres chips + tableau STATUT picto/PHOTO/NOM/PRÉNOM/IMPLANTATION/GRADE/DIPLÔMÉ/FORMATION) `done`
- [x] 75-1 (Académie Hub) : academie-hub-refonte-page-joueurs (**P1 FEATURE** — redesign `/academie/joueurs` : 4 métriques + toggle AUREAK/PROSPECT + tableau redesigné — dépend 75-2 done) `done`

**Dépendances** : 75-2 avant 75-1 (75-2 crée la structure hub + AcademieNavBar que 75-1 utilise). Aucune migration DB.

---

## Epic 86 — Architecture Rôles & Permissions

> Fondation permissions granulaires et multi-rôle. Bloque Epics 87 (Académie Commerciaux/Marketeurs), 88 (Prospection Clubs), 90 (Prospection Entraîneurs), 91 (Marketing), 92 (Partenariat).
> Source : brainstorming `_bmad-output/brainstorming/brainstorming-session-2026-04-18-1000.md` — idées #6, #7, #34, #35, #36, #39.

- [ ] 86-1 : roles-db-manager-marketeur (**P0 INFRA** — migration 00148 : `ALTER TYPE user_role ADD VALUE 'manager', 'marketeur'` + miroir `UserRole` dans `@aureak/types/enums.ts`. `commercial` déjà présent en 00147) `ready-for-dev`
- [ ] 86-2 : multi-role-profile-roles-switcher (**P0 FEATURE** — table `profile_roles` N-N + trigger backfill + API `listUserRoles/assignRoleToUser/revokeRoleFromUser` + hooks `useCurrentRole`/`useAvailableRoles` + composant `@aureak/ui/RoleSwitcher` — migration 00149) `ready-for-dev`
- [ ] 86-3 : permissions-granulaires-matrice-admin (**P0 FEATURE** — enums `section_key`/`permission_access` + tables `section_permissions` (défaut par rôle, seedée) + `user_section_overrides` (individuel) + API `getEffectivePermissions` + page `/settings/permissions` matrice éditable — migration 00150) `ready-for-dev`
- [ ] 86-4 : sidebar-dynamique-permissions (**P0 FEATURE** — refactor `_layout.tsx` : `NAV_GROUPS` statique → `buildNavGroups(activeRole, permissions)` + labels contextualisés par rôle + skeleton loading + intégration `RoleSwitcher` — aucune migration) `ready-for-dev`

**Dépendances** : 86-1 → 86-2, 86-3 (parallèle possible après 86-1) → 86-4 (consomme 86-2 et 86-3). Ordre dev strict : 86-1 → 86-2 → 86-3 → 86-4.

**Migrations réservées** : 00148 (86-1), 00149 (86-2), 00150 (86-3). 86-4 sans migration.

---

## Epic 87 — Académie Commerciaux & Marketeurs

> Complète l'annuaire Académie pour les 3 rôles introduits en Epic 86 (commercial, manager, marketeur). Pages liste + fiche personne universelle + onglet accès.
> Source : brainstorming `_bmad-output/brainstorming/brainstorming-session-2026-04-18-1000.md` — idées #37, #38, #39.

- [ ] 87-1 : pages-academie-commerciaux-marketeurs-managers (**P1 FEATURE** — +2 onglets `AcademieNavBar` (COMMERCIAUX, MARKETEURS), composant `PeopleListPage` factorisé, pages `/academie/commerciaux`, `/academie/marketeurs`, `/academie/managers` (remplace stub), API `listProfilesByRole`, aucune migration DB — stub `/profiles/[userId]` pour 87-2) `ready-for-dev`
- [ ] 87-2 : fiche-personne-universelle (**P1 FEATURE** — layout unifié `/profiles/[userId]` : hero + tabs Résumé/Activité/Accès sync sur ?tab=, modules role-aware Pipeline/Accès étendus/Contenus/Grade coach, card Actions cycle de vie, onglet Accès = placeholder pour 87-3) `ready-for-dev`
- [ ] 87-3 : onglet-acces-fiche-personne (**P1 FEATURE** — 3 sections sur `/profiles/[userId]?tab=acces` : rôles chips + modal ajout via `profile_roles`, matrice permissions × sections avec toggle override via `user_section_overrides`, historique dérivé des timestamps — admin only, aucune migration, 2 fonctions API `*History`) `ready-for-dev`
- [ ] 87-4 : invitation-dediee-commercial-manager-marketeur (**P1 FEATURE** — 3 routes `/academie/<role>/new` + form slim partagé `NewPersonForm` (4 champs + toggle invite/fiche), helper API `invitePerson` wrappant `create-user-profile` Edge Function existante, remplace les liens `#invite-...` bricolés en 87-1, aucune migration) `ready-for-dev`
- [ ] 87-5 : users-redirect-profiles (**P1 REFACTOR** — remplace `/users/[userId]` (DOM brut 398 lignes) par un `<Redirect>` vers `/profiles/[userId]`, update caller unique `/users/index.tsx:232` pour pointer directement, supprime duplication fiche, XS effort) `ready-for-dev`

**Dépendances** : Epic 86 entier done (requis pour `user_role` commercial/manager/marketeur et `user_section_overrides`). 87-1 → 87-2 → 87-3.

**Migrations réservées** : aucune (Epic 87 = UI + 1 fonction API uniquement).

---

### Epic 89 — Prospection Gardiens (funnel commercial)

Objectif : outiller le scout/commercial pour identifier, inviter, tracer et convertir des gardiens prospects — de la détection terrain jusqu'à l'inscription Académie.

Ordre d'implémentation recommandé : 89-4 → 89-5 → 89-6 → 89-1 → 89-2 → 89-3

- [x] 89-4 : invitation-seance-gratuite-depuis-app (migration 00153, enum `prospect_status`, table `prospect_invitations`, Edge Fn `send-trial-invitation`)
- [x] 89-5 : liste-attente-intelligente-notification-absence (migration 00154, table `trial_waitlist`, Edge Fn `confirm-trial-slot`)
- [x] 89-6 : seance-gratuite-usage-unique-tracable (migration 00155, colonnes `trial_used`/`trial_date`/`trial_outcome`, valeur enum `'candidat'`, funnel stats)
- [ ] 89-1 : recherche-ajout-gardien-scout-terrain (P1 — mobile-first scout field, migration 00156 index doublon + `searchChildDirectoryByName` + formulaire minimal 6 champs + garde-fou doublon)
- [ ] 89-2 : note-evaluation-scout-rapide (P1 — migration 00157 table dédiée `prospect_scout_evaluations` + enum `scout_observation_context` + `StarRating` 1-5 + commentaire libre + contexte observation + historique desc + stats moyenne/dernière + fenêtre édition 24h + soft-delete)
- [ ] 89-3 : visibilite-donnees-conditionnelle-rgpd (P1 — migrations 00158 + 00159 tables `prospect_access_grants`/`_requests`/`_log` + enums + triggers auto-grant + vue `v_child_directory_rgpd` + RPC `get_child_directory_rgpd[_list]` + fonctions `mask_email`/`mask_phone`/... + Edge Fn `notify-rgpd-access-request`/`_resolved` + composant `MaskedField` + page admin `/admin/rgpd/prospect-access`)

**Dépendances** :
- 89-1 : requiert 89-4 (enum `prospect_status` + colonne). Indépendant de 89-5 et 89-6 au niveau code mais complémentaire au funnel.
- 89-2 : indépendante des autres 89. S'intègre à la fiche joueur `/children/[childId]`. Table dédiée distincte de `evaluations` coach.
- 89-3 : **requiert 89-2 mergée** (trigger `trg_prospect_scout_evaluation_auto_grant` pose sur la table de 89-2). Requiert aussi 89-4 (mergé ✅ pour `prospect_invitations`). S'intègre via triggers non-invasifs sur les tables des stories satellites. Grain de permission orthogonal à Epic 86.

**Migrations réservées** : 00153 (89-4 ✅), 00154 (89-5 ✅), 00155 (89-6 ✅), 00156 (89-1), 00157 (89-2), 00158 + 00159 (89-3).

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
