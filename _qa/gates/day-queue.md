date: 2026-04-05
status: in-progress

# ── Queue /morning 5 avril 2026 — feedback Jeremy ─────────────────────────────

next-morning-queue:

  # ── EPIC 52 — Player Cards Ultimate Squad ────────────────────────────────

  - story_id: story-52-2
    title: "FEATURE — 6 stats gardien PLO/TIR/TEC/TAC/PHY/MEN"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    commit: "b4b05e7"
    qa_reports:
      - "_qa/reports/2026-04-05_story-52-2_gate1.md"
      - "_qa/reports/2026-04-05_story-52-2_gate2.md"
    notes:
      - "gamification.statBands + statLabels dans @aureak/theme/tokens.ts"
      - "playerStats.ts créé dans @aureak/business-logic (computePlayerStats + computePlayerTier)"
      - "StatsRow composant interne PlayerCard — couleurs depuis gamification.statBands (0 hardcode)"
      - "PlayerCard tier prop optionnelle — auto-calculé via computePlayerTier()"
      - "tsc: 0 erreur"

  - story_id: story-52-3
    title: "FEATURE — Shimmer animation cards Elite"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: "45bbd47"
    qa_reports:
      - "_qa/reports/2026-04-05_story-52-3_gate1.md"
      - "_qa/reports/2026-04-05_story-52-3_gate2.md"
    notes:
      - "useShimmerEffect() hook singleton — intégré dans commit story 52-2"
      - "@keyframes shimmerGold + ::before pseudo-element via <style> tag injection"
      - "Singleton id 'aureak-shimmer-styles' — 0 doublon si N cards Elite"
      - "prefers-reduced-motion respecté (JS + CSS media query)"
      - "Fallback mobile : borderWidth 2px gold solide sans animation"
      - "tsc: 0 erreur"

  - story_id: story-52-4
    title: "FEATURE — Toggle galerie PlayerCard vs liste PremiumJoueurCard"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-52-4_gate1.md"
      - "_qa/reports/2026-04-05_story-52-4_gate2.md"
    notes:
      - "ViewMode state 'galerie'|'liste' — localStorage aureak_players_view_mode"
      - "Toggle buttons ⊞/☰ dans headerActions — actif gold + texte blanc"
      - "Vue galerie : PlayerCard flexWrap row gap 16, PAGE_SIZE 48"
      - "Vue liste : PremiumJoueurCard inchangé, PAGE_SIZE 50"
      - "Pagination.pageSize prop ajoutée — dynamique selon viewMode"
      - "setPage(0) sur changement viewMode"
      - "tsc: 0 erreur"

  - story_id: story-52-9
    title: "FEATURE — Badges collection fiche joueur"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-52-9_gate1.md"
      - "_qa/reports/2026-04-05_story-52-9_gate2.md"
    notes:
      - "BadgeItem type dans @aureak/types/entities.ts"
      - "BadgeGrid composant dans @aureak/ui — gamification.badge.* tokens exclusivement"
      - "computePlayerBadges + BADGE_DEFINITIONS (10 badges) dans @aureak/business-logic/playerStats.ts"
      - "BadgeGrid positionné dans tab Académie sous XPBar avec SectionTitle"
      - "Tooltip web via title HTML attribute"
      - "tsc: 0 erreur"

  - story_id: story-52-10
    title: "FEATURE — Radar chart 6 axes SVG pur"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-52-10_gate1.md"
      - "_qa/reports/2026-04-05_story-52-10_gate2.md"
    notes:
      - "RadarChart composant dans @aureak/ui — SVG JSX natif web + barres fallback native"
      - "polarToCartesian + computePolygonPoints + computeGridPoints helpers purs"
      - "TIER_FILL couleurs par tier, fill +4D (30% opacité)"
      - "Grille 3 niveaux concentriques 33%/66%/100% radius"
      - "Labels axes avec valeurs via <tspan>"
      - "Positionné dans tab Profil sous identité avec SectionTitle"
      - "tsc: 0 erreur"

  - story_id: story-52-11
    title: "FEATURE — Export card joueur PNG"
    priority: P3
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-52-11_gate1.md"
      - "_qa/reports/2026-04-05_story-52-11_gate2.md"
    notes:
      - "exportCardToPng.ts : html2canvas(scale:2, useCORS) + Web Share API + download fallback"
      - "Bouton Partager ↗ dans header page.tsx — Platform.OS === 'web' uniquement"
      - "Conteneur off-screen (top:-9999) avec photo/nom/tier/stats/logo AUREAK"
      - "try/finally sur isExporting — console guard sur catch"
      - "html2canvas v1.4.1 installé dans apps/web"
      - "tsc: 0 erreur"

  - story_id: story-52-12
    title: "FEATURE — Vue master-detail joueurs split-screen"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-52-12_gate1.md"
      - "_qa/reports/2026-04-05_story-52-12_gate2.md"
    notes:
      - "isSplitScreen = Platform.OS === 'web' && screenWidth >= 1024"
      - "screenWidth state + window.addEventListener('resize') avec cleanup"
      - "selectedChildId initialisé depuis params.selected"
      - "_ChildDetail.tsx : ChildDetailInline (iframe) + EmptyDetailState"
      - "PremiumJoueurCard : props onPress? isSelected? ajoutés (retro-compatible)"
      - "ssp StyleSheet : splitContainer/leftPanel(340px)/rightPanel(flex:1)"
      - "tsc: 0 erreur"

  # ── EPIC 50 — Hero Band salle de commandement ────────────────────────────

  - story_id: story-50-10
    title: "FEATURE — Dashboard KPI tiles réorganisables drag-drop"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-50-10_gate1.md"
      - "_qa/reports/2026-04-05_story-50-10_gate2.md"
    notes:
      - "KpiTileId type + KPI_DEFAULT_ORDER + KPI_ORDER_KEY constants"
      - "loadKpiOrder() avec validation Array + every() + try/catch fallback"
      - "DraggableKpiCard composant HTML5 DnD natif (draggable, onDragStart/Over/Drop/End)"
      - "kpiOrder state + useEffect persistance localStorage (quota-safe)"
      - "isOrderDefault via useMemo — bouton réinitialiser conditionnel"
      - "6 tiles draggables (children/attendance/mastery/sessions/coaches/groups)"
      - "5 tiles fixes non réorganisables (implantations/anomalies/météo/countdown/streak)"
      - "CSS [draggable=true] user-select: none — tsc 0 erreur"

  - story_id: story-50-9
    title: "FEATURE — Dashboard Focus mode plein écran"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-50-9_gate1.md"
      - "_qa/reports/2026-04-05_story-50-9_gate2.md"
    notes:
      - "bouton ⛶ dans HeroBand (prop onEnterFocusMode) — tooltip 'Mode plein écran'"
      - "containerStyle fixed/inset:0/z-index:500 + animation focus-enter 0.3s"
      - "body.focus-mode-active styles injectés dynamiquement via createElement('style')"
      - "data-sidebar + data-topbar ajoutés dans _layout.tsx"
      - "Escape cleanup useEffect + unmount cleanup — tsc 0 erreur"

  - story_id: story-50-7
    title: "FEATURE — Dashboard anomalies inline compactes"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-50-7_gate1.md"
      - "_qa/reports/2026-04-05_story-50-7_gate2.md"
    notes:
      - "AnomalyPill + AnomalyModal + Toast — 3 composants inline dans dashboard/page.tsx"
      - "handleResolve optimiste : filter local + setSelectedAnomaly(null) + toast — plus de reload"
      - "Escape cleanup useEffect — try/finally setResolving dans AnomalyModal"
      - "Empty state fond vert — résumé critique/warning/info — tsc 0 erreur"

  - story_id: story-50-6
    title: "FEATURE — Dashboard Forme du moment tile"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-50-6_gate1.md"
      - "_qa/reports/2026-04-05_story-50-6_gate2.md"
    notes:
      - "getTopStreakPlayers() dans api-client/admin/dashboard.ts : 90j attendance, streak JS, seuil >=5"
      - "StreakTile + InitialsAvatar dans dashboard/page.tsx — bento-medium"
      - "try/finally setLoadingStreaks — console guards NODE_ENV — tsc 0 erreur"
      - "Égalité de score résolue par childId.localeCompare() — déterministe"

  - story_id: story-50-5
    title: "FEATURE — Dashboard Live Activity Feed"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-50-5_gate1.md"
      - "_qa/reports/2026-04-05_story-50-5_gate2.md"
    notes:
      - "Layout 2 colonnes : main-col (flex:1) + aside-col (280px sticky)"
      - "fetchActivityFeed() dans api-client/admin/dashboard.ts : 5 presences + 5 new_players"
      - "Realtime channel 'dashboard-activity' sur attendance_records INSERT"
      - "unsubscribe() dans useEffect cleanup — AC7 fallback CHANNEL_ERROR géré"

  - story_id: story-50-4
    title: "DESIGN — Dashboard ImplantationCard terrain premium"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-50-4_gate1.md"
      - "_qa/reports/2026-04-05_story-50-4_gate2.md"
    notes:
      - "Header 80px gradient vert terrain — ImplantationCardHeader remplacée par header inline"
      - "children_count absent de ImplantationStats → badge affiche groups.length"
      - "listGroupsByImplantation() en parallèle après getImplantationStats"

  - story_id: story-50-3
    title: "FEATURE — Dashboard prochaine séance countdown tile"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-50-3_gate1.md"
      - "_qa/reports/2026-04-05_story-50-3_gate2.md"
    notes:
      - "listNextSessionForDashboard() — nouvelle fonction (listUpcomingSessions existante conservée)"
      - "CountdownTile dans bento-medium, clearInterval dans useEffect return"

  - story_id: story-50-2
    title: "DESIGN — Dashboard KPI cards sparkline + delta"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-50-2_gate1.md"
      - "_qa/reports/2026-04-05_story-50-2_gate2.md"
    warnings:
      - "W1: rgba(76,175,80/244,67,54,0.10) dans DeltaPill — tokens colors.status.presentBg manquants (pré-existant)"
      - "W2: TERRAIN_GRADIENT hex hardcodés (pré-existant story-49-5)"
    fixed:
      - "FIXED: SparklineSVG guard NaN (story-49-5 W5)"
      - "FIXED: DeltaPill refactorisée — calcul delta depuis data[] (suppression delta prop hardcodé)"

  - story_id: story-50-1
    title: "DESIGN — Dashboard Hero Band salle de commandement"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-50-1_gate1.md"
      - "_qa/reports/2026-04-05_story-50-1_gate2.md"
    warnings:
      - "W1: TERRAIN_GRADIENT hex hardcodés #1a472a/#2d6a4f (pré-existant story-49-5)"
      - "W2: rgba() hardcodés DeltaPill/NextSessionTile (pré-existant story-49-5 W3)"
      - "W3: rgba(255,255,255,0.75/0.6) KpiCard implantations (pré-existant story-49-5 W3)"
      - "W4: paddingLeft/Right/marginBottom HeroBand numériques — devrait utiliser space.xl/lg (mineur)"

  # ── EPIC 49 — Feedback #3 Jeremy (créées 2026-04-05) ─────────────────────

  - story_id: story-49-8
    title: "BUG P1 — Dashboard getImplantationStats erreur 400 (fn SQL manquante)"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    commit: "cfb1318"

  - story_id: story-49-1
    title: "BUG P1 — Création coach — Edge Function non-2xx persistant"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    commit: "93317f9"

  - story_id: story-49-2
    title: "UX — Blocs thèmes éditables depuis fiche séance"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: "b4c8d5e"

  - story_id: story-49-3
    title: "BUG — Joueurs liés au club non visibles (annuaire)"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-49-3_gate1.md"
      - "_qa/reports/2026-04-05_story-49-3_gate2.md"
    warnings:
      - "W1: #a78bfa hardcodé — token colors.accent.violet manquant dans @aureak/theme"
      - "W2: linksRes.data sans optional chaining (pre-existant)"
      - "W3: label sections 'actuellement' vs 'affilié' ambigu (UX future)"
      - "W4: erreur listChildrenByClubDirectoryId absorbée silencieusement"

  - story_id: story-49-4
    title: "UX — Présences — liste enfants groupe pré-chargée avec toggle"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-49-4_gate1.md"
      - "_qa/reports/2026-04-05_story-49-4_gate2.md"
    warnings:
      - "W1: 'unconfirmed' absent de l'enum DB attendance_status — désynchronisation DB↔TS"
      - "W2: handleCancel/handlePostpone sans try/catch (pré-existant)"
      - "W3: handleAddGuest double-clic possible sans loading guard (pré-existant)"
      - "W4: setTimeout orphelin possible lors d'un retry après erreur rollback"

  - story_id: story-49-5
    title: "DESIGN — Dashboard game manager premium (sparklines + hero band)"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-49-5_gate1.md"
      - "_qa/reports/2026-04-05_story-49-5_gate2.md"
    warnings:
      - "W1: colors.text.primary sémantique trompeuse HeroBand h1 (token OK, contexte ambigu)"
      - "W2: colors.text.primary sur ImplantationCardHeader (idem W1)"
      - "W3: rgba() hardcodés DeltaPill/NextSessionTile — à extraire en tokens"
      - "W4: NextSessionTile label EN RETARD systématique — logique temporelle manquante"
      - "W5: SparklineSVG sans guard NaN — à ajouter"
    blocker_fixed:
      - "BLOCKER: SparklineSVG markers fill colors.text.primary (#FFFFFF) sur fond blanc — corrigé → colors.text.dark"

  - story_id: story-49-6
    title: "DESIGN — Implantations — photo/logo upload + redesign détail"
    priority: P2
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: story-49-7
    title: "FEATURE — Affiliation automatique joueurs → club par saison"
    priority: P3
    status: done
    gate1: pass
    gate2: pass
    commit: "d121507"
    qa_reports:
      - "_qa/reports/2026-04-05_story-49-7_gate1.md"
      - "_qa/reports/2026-04-05_story-49-7_gate2.md"
    warnings:
      - "W1: fontSize 13/12 hardcodés (3 lignes nouvelles) — tech debt pré-existant fichier"
      - "W2: gap migration 00114/00115 pré-existant — vérifier branches"
      - "W3: layout shift section autoClub (chargement async) — optionnel skeleton"
      - "W4: setState async sans isMounted guard — tech debt global"
      - "W5: saison non affichée dans l'UI — UX enhancement hors scope"

  # ── BUGS P1 ───────────────────────────────────────────────────────────────

  - story_id: story-44-7
    title: "BUG — Edge Function create-user-profile — déploiement + secrets"
    priority: P1
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: story-46-1
    title: "BUG — Fiche séance — joueurs du groupe non affichés"
    priority: P1
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: story-46-2
    title: "BUG — Création séance — Safari autocomplete déclenche popup mot de passe"
    priority: P1
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  # ── BUGS P2 ───────────────────────────────────────────────────────────────

  - story_id: story-46-3
    title: "BUG — Création séance — sélecteur coach scroll broken"
    priority: P2
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: story-42-3
    title: "BUG — Dashboard — compteur joueurs actifs incorrect"
    priority: P2
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: story-43-4
    title: "BUG — Méthodologie thèmes — cards trop grandes (5 cols)"
    priority: P2
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  # ── DESIGN ────────────────────────────────────────────────────────────────

  - story_id: story-42-4
    title: "DESIGN — Dashboard bento — photos implantations + icônes KPI"
    priority: P2
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: story-51-1
    title: "DESIGN — Sidebar — icônes SVG custom + barre or active state"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-51-1_gate1.md"
      - "_qa/reports/2026-04-05_story-51-1_gate2.md"
    notes:
      - "23 composants icônes SVG react-native-svg dans @aureak/ui/src/icons/"
      - "NavItem type: icon:string → Icon:NavIconComponent"
      - "labels séparateurs: colors.text.secondary → colors.text.subtle"
      - "hover: rgba(255,255,255,0.08) → rgba(255,255,255,0.06)"
      - "tsc 0 erreur — zero emoji dans NAV_GROUPS"

  - story_id: story-51-3
    title: "FEATURE — Command palette ⌘K recherche unifiée"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-51-3_gate1.md"
      - "_qa/reports/2026-04-05_story-51-3_gate2.md"
    notes:
      - "CommandResult/CommandResultType types dans @aureak/types/entities.ts"
      - "searchUnified() dans api-client/admin/search.ts — 3 requêtes parallèles Promise.allSettled"
      - "NAV_COMMANDS (14 routes) + DEFAULT_COMMANDS (top 6) + filterNavCommands() dans constants/navCommands.ts"
      - "useCommandPalette hook — capture phase keyboard listener, debounce 150ms, try/finally"
      - "CommandPalette composant — overlay fixed, Pressable backdrop, groupResults, empty state, footer hints"
      - "useKeyboardShortcuts : Cmd+K retiré (délégué à useCommandPalette capture phase)"
      - "_layout.tsx : <CommandPalette /> hors du flux principal"
      - "tsc 0 erreur — Playwright skipped (app non démarrée)"

  - story_id: story-51-4
    title: "FEATURE — Badges sidebar présences (rouge) + séances (or)"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-51-4_gate1.md"
      - "_qa/reports/2026-04-05_story-51-4_gate2.md"
    notes:
      - "NavBadgeCounts interface dans @aureak/types/entities.ts"
      - "getNavBadgeCounts() dans api-client/admin/dashboard.ts — 2 requêtes parallèles"
      - "NavBadge composant dans apps/web/components/NavBadge.tsx — dot 8×8 / chiffré 16×16 (cap 99+)"
      - "navBadges state + polling 5min avec clearInterval cleanup + cancelled flag"
      - "Badges visibles en modes collapsed ET expanded — position: relative sur l'icône"
      - "console guards NODE_ENV production — tsc 0 erreur"
      - "Playwright skipped — app non démarrée"

  - story_id: story-51-5
    title: "FEATURE — Breadcrumb animé cliquable"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-51-5_gate1.md"
      - "_qa/reports/2026-04-05_story-51-5_gate2.md"
    notes:
      - "BreadcrumbContext (labels map + setLabel callback) dans app/contexts/"
      - "parseBreadcrumbs() + ROUTE_LABELS (25+ routes) dans app/utils/breadcrumbs.ts"
      - "Breadcrumb composant — HIDDEN_PATHS, isMobile guard, items.length<=1 guard"
      - "BreadcrumbAnimated — key={pathname} + Animated.parallel opacity+translateX 200ms"
      - "Pressable segments cliquables, Text segment actif non-pressable"
      - "BreadcrumbProvider wrappé dans _layout.tsx (outermost), <Breadcrumb /> avant ErrorBoundary"
      - "tsc 0 erreur — Playwright skipped (app non démarrée)"

  - story_id: story-51-6
    title: "FEATURE — Raccourcis clavier navigation (chord style Linear)"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-51-6_gate1.md"
      - "_qa/reports/2026-04-05_story-51-6_gate2.md"
    notes:
      - "CHORD_MAP exportée : G→8 routes, N→3 routes créations"
      - "useKeyboardShortcuts enrichi : prefixKey state + chordTimerRef 1s + isInputFocused guard"
      - "ShortcutsHelp.tsx : overlay dark card radius=16 shadows.gold + 3 sections (Naviguer/Créer/Général)"
      - "KeyboardPrefixHint.tsx : badge fixed bottom-right gold avec clé active + ellipsis"
      - "ITEM_SHORTCUTS map + hints fontSize=9 en mode expanded uniquement (_layout.tsx)"
      - "AC7 compat ⌘K : CommandPalette TextInput focusé → isInputFocused=true → chords bloqués"
      - "Bug corrigé : $mono → $body (token absent Tamagui config) — tsc 0 erreur"

  - story_id: story-51-2
    title: "FEATURE — Topbar séance active permanente"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-51-2_gate1.md"
      - "_qa/reports/2026-04-05_story-51-2_gate2.md"
    notes:
      - "ActiveSessionInfo interface dans @aureak/types/entities.ts"
      - "getActiveSession() dans api-client/sessions/sessions.ts — fenêtre -30min/+duration+15min côté client"
      - "ActiveSessionBar composant — PulsingDot Animated.loop + lien Voir → + (+N autres)"
      - "polling 60s dans _layout.tsx avec clearInterval cleanup + flag cancelled (anti-setState-leak)"
      - "guard !isMobile — non rendu sur < 768px (AC7)"
      - "console guard NODE_ENV production — try/catch dégradation silencieuse (AC5)"
      - "tsc 0 erreur — fix groups[] Supabase array vs object"

  - story_id: story-51-7
    title: "FEATURE — Sidebar collapse smooth animation + tooltips"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-51-7_gate1.md"
      - "_qa/reports/2026-04-05_story-51-7_gate2.md"
    notes:
      - "transition: 'width 0.28s ease' dans YStack sidebar (overflow:hidden) — AC1"
      - "labelsVisible state séparé : setLabelsVisible(false) immédiat → setSidebarCollapsed(true) après 80ms — AC2"
      - "Expand : setSidebarCollapsed(false) immédiat → setLabelsVisible(true) après 180ms — AC3"
      - "NavTooltip composant (position:absolute, left:36, zIndex:100) — AC4/AC5"
      - "HoverablePressable wrapper typé (extends PressableProps) pour onMouseEnter/Leave — AC4"
      - "Animated.Value + Animated.timing 280ms ease rotation bouton toggle ‹/› — AC7"
      - "isInitialRender.current = false dans useEffect — guard animation initiale (AC6)"
      - "localStorage déjà implémenté — vérifié intact (AC6)"
      - "tsc 0 erreur — HoverablePressable cast ComponentType résout onMouseEnter RN typings"

  - story_id: story-47-1
    title: "DESIGN — Sidebar — icônes navigation manquantes"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    notes:
      - "Superseded by story-51-1 (implémentation complète)"

  - story_id: story-47-2
    title: "DESIGN — Implantation — visuel enrichi (photo + groupes style card)"
    priority: P2
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  # ── UX ────────────────────────────────────────────────────────────────────

  - story_id: story-44-8
    title: "UX — Groupe — clic joueur → fiche éditable /children/:id"
    priority: P2
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: story-47-3
    title: "UX — Hub séances unifié (séances + présences + évaluations)"
    priority: P3
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  # ── FEATURE ───────────────────────────────────────────────────────────────

  - story_id: story-47-4
    title: "FEATURE — Liaisons joueurs-clubs auto-affiliation par saison"
    priority: P3
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  # ── EPIC 52 — Player Cards Ultimate Squad ────────────────────────────────

  - story_id: story-52-1
    title: "DESIGN — PlayerCard FUT-style 160×220px avec tiers visuels"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-52-1_gate1.md"
      - "_qa/reports/2026-04-05_story-52-1_gate2.md"
    notes:
      - "PlayerCard.tsx dans @aureak/ui — 4 tiers : Prospect/Académicien/Confirmé/Elite"
      - "playerTiers tokens ajoutés dans @aureak/theme/tokens.ts + exportés depuis index.ts"
      - "PLAYER_TIER_LABELS dans @aureak/types/enums.ts (mapping AcademyStatus → PlayerTier)"
      - "PhotoAvatar interne : photo Supabase + fallback initiales avatarBgColor(id)"
      - "size='normal' (160×220) / size='compact' (140×193) — props JoueurListItem + tier + onPress"
      - "AC6 : zéro couleur hardcodée — tout via playerTiers.* et colors.* tokens"
      - "tsc 0 erreur — Playwright skipped (app non démarrée)"
    warnings:
      - "W1: paddingVertical:3 badge non-token (delta 1px vs space.xs=4)"
      - "W2: borderWidth:1.5 non-token (FUT spec)"
      - "W6: marginTop:space.md=16px vs spec 20px (token le plus proche)"

  # ── PATROL 2026-04-05 — nouvelles findings ────────────────────────────────

  - story_id: story-47-5
    title: "BUG — Sidebar lien Groupes → 404"
    priority: P1
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: story-46-4
    title: "BUG — Séances — Unexpected text node erreurs React"
    priority: P1
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: story-48-1
    title: "BUG — Page /stages — Erreur 400 + bannière rouge"
    priority: P1
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  - story_id: story-48-2
    title: "BUG — Vue SQL v_club_gardien_stats manquante"
    priority: P2
    status: pending
    gate1: pending
    gate2: pending
    commit: ""

  # ── LEGACY (preserved from previous morning queue) ────────────────────────

  - story_id: story-45-1
    title: "Design System — Montserrat + tokens gamification (XP/niveaux/badges)"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    commit: "f243df0"
    note: "Prérequis de tout le redesign — passe en premier"

  - story_id: story-43-1
    title: "BUG — Supprimer un entraînement pédagogique"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    commit: "7a0e396"

  - story_id: story-42-1
    title: "Dashboard admin — refonte bento visuel"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: "198cd96"

  - story_id: story-42-2
    title: "Page Présences — redesign visuel compact"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: "acd8b70"

  - story_id: story-43-2
    title: "Méthodologie — cards entraînements compactes"
    priority: P3
    status: done
    gate1: pass
    gate2: pass
    commit: "0d8c36c"

  - story_id: story-43-3
    title: "Modules structurés entraînement Goal & Player"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: "6c66b49"

  - story_id: story-34-1
    title: "Architecture Programme pédagogique — formulaire intelligent"
    priority: P1
    status: blocked
    gate1: pending
    gate2: pending
    note: "Epic 34 = back-button (conflit ID). Besoin création nouveaux fichiers epic 46+"

  - story_id: story-34-2
    title: "Navigation Programme — UX bibliothèque"
    priority: P1
    status: blocked
    gate1: pending
    gate2: pending
    note: "Dépend de story-34-1 (bloquée — même conflit epic)"

  # ── Queue /morning 5 avril 2026 — feedback #2 Jeremy ──────────────────────

  - story_id: story-44-1
    title: "BUG — Edge Function non-2xx création coach"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    commit: "b9c6508"

  - story_id: story-44-2
    title: "BUG — Filtre saison actuelle retourne 0 joueurs"
    priority: P1
    status: done
    gate1: pass
    gate2: pass
    commit: "84d101e"

  - story_id: story-44-3
    title: "UX — Création coach : rôle pré-sélectionné depuis /coaches"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: "ef33ce3"

  - story_id: story-44-4
    title: "Fiche joueur — parents liés + club actuel cliquable"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: "ca845fe"
    note: "Déjà implémentée — vérification only"

  - story_id: story-44-5
    title: "Mini stats joueur dans la fiche groupe"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: "a454565"

  - story_id: story-44-6
    title: "Implantation enrichie — stats groupes + listing enfants"
    priority: P3
    status: done
    gate1: pass
    gate2: pass
    commit: "3a1409a"

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

  # ── EPIC 51 — Navigation & Shell ─────────────────────────────────────────

  - story_id: story-51-8
    title: "Dark mode complet + toggle persistant"
    priority: P2
    status: done
    gate1: pass
    gate2: pass
    commit: ""
    qa_reports:
      - "_qa/reports/2026-04-05_story-51-8_gate1.md"
      - "_qa/reports/2026-04-05_story-51-8_gate2.md"
    notes: "Playwright skipped — app non démarrée"
