# QA Summary — Aureak

Dernière mise à jour : 2026-04-09

---

## Story 81-1 — Méthodologie Entraînements — LayoutActivités

**Gate 1** : Non exécuté (dev agent)
**Gate 2** : PASS (0 blocker, 8 warnings)

### Findings Gate 2 (design / UX / bug hunting)

| ID | Catégorie | Sévérité | Description | Statut |
|----|-----------|----------|-------------|--------|
| W-D1 | Design | WARNING | minWidth statCard 130 vs spec 160 | Non bloquant |
| W-D2 | Design | WARNING | Pas de hover feedback sur statCards | Non bloquant |
| W-UX1 | UX | WARNING | fontSize/spacing partiellement hardcodés | Non bloquant |
| W-UX2 | UX | WARNING | loadSessions/loadExercises sans catch — erreur réseau silencieuse | Non bloquant |
| W-B2 | Bug | WARNING | StatCards basées sessions uniquement — pas de switch exercices | Non bloquant |

### Dette technique identifiée

- Ajouter catch sur loadSessions/loadExercises avec toast.error
- Faire basculer les StatCards selon contentType (sessions vs exercices)
- Normaliser fontSize/spacing vers tokens

---

## Story 49-1 — BUG P1 — Création coach impossible — Edge Function non-2xx

**Gate 1** : PASS (après corrections blockers)
**Gate 2** : PASS (0 blocker)

### Findings Gate 1 (code review)

| ID | Sévérité | Description | Statut |
|----|----------|-------------|--------|
| BLOCKER-B1 | BLOCKER | `setClubsLoading(false)` en `.then()` sans `.finally()` → spinner infini si erreur réseau | CORRIGÉ |
| BLOCKER-B2 | BLOCKER | 30+ couleurs hardcodées dans `s` styles object et template CSS → violation règle tokens | CORRIGÉ |
| WARNING-W1 | WARNING | `listImplantations` sans `.catch()` → erreur silencieuse | Non bloquant |
| WARNING-W2 | WARNING | `listGroupsByImplantation` sans `.catch()` → erreur silencieuse | Non bloquant |

### Findings Gate 2 (UX / bug hunting)

| ID | Catégorie | Sévérité | Description | Statut |
|----|-----------|----------|-------------|--------|
| W-G2-1 | Bug/UX | WARNING | Message "Failed to fetch" affiché tel quel lors coupure réseau | Non bloquant |
| W-G2-2 | UX | WARNING | Message "Tenant non défini." trop technique — peu lisible pour l'admin | Non bloquant |
| W-G2-3 | Bug | WARNING | `listImplantations` + `listGroupsByImplantation` sans gestion d'erreur (même que W1/W2) | Non bloquant |

### Dette technique identifiée

- Ajouter un cas `Failed to fetch` / `NetworkError` dans `formatEdgeFunctionError()` (polish)
- Remplacer "Tenant non défini." par "Erreur de session : veuillez vous reconnecter."
- Ajouter `.catch()` sur `listImplantations` et `listGroupsByImplantation`

---

## Story 49-8 — Dashboard implantations stats (get_implantation_stats)

**Gate 1** : PASS (après corrections blockers)
**Gate 2** : PASS (après correction blocker)

### Findings Gate 1 (code review + sécurité)

| ID | Sévérité | Description | Statut |
|----|----------|-------------|--------|
| BLOCKER-1 | BLOCKER | sessions.status = 'closed' invalide → corrigé en `IN ('réalisée', 'terminée')` | CORRIGÉ |
| BLOCKER-2 | BLOCKER | Tenant isolation via subquery raw → corrigé en `current_tenant_id()` | CORRIGÉ |
| WARNING-W1 | WARNING | useEffect load sans dépendances (exhaustive-deps) | Non bloquant |
| WARNING-W2 | WARNING | Gradient vert hardcodé card Implantations | Dette tech — token futur |

### Findings Gate 2 (design / UX / bug hunting)

| ID | Catégorie | Sévérité | Description | Statut |
|----|-----------|----------|-------------|--------|
| BLOCKER-B1 | Bug | BLOCKER | Card Anomalies : "dont 0 critique" quand anomalies>0 et criticalCount=0 | CORRIGÉ |
| WARNING-D1 | Design | WARNING | Gradient vert #1a472a/#2d6a4f hardcodé (card Implantations) — intentionnel | Dette tech |
| WARNING-D2 | Design | WARNING | `color: '#FFFFFF'` dans resolveBtn — substituable par `colors.text.primary` | Non bloquant |
| WARNING-B1 | Bug/UX | WARNING | Pas de validation p_from > p_to en mode custom dates | Non bloquant |
| WARNING-B2 | Bug/UX | WARNING | `statsError` non positionné à true dans le catch global (exception réseau) | Non bloquant |
| WARNING-UX1 | UX | WARNING | KPIs Joueurs/Coachs/Groupes : pas de distinction erreur vs zéro | Non bloquant |

### Dette technique identifiée

- Ajouter `colors.accent.greenField` et `colors.accent.greenFieldDark` dans `@aureak/theme/tokens.ts` pour le gradient terrain (card Implantations)
- Ajouter validation des dates custom (p_from ≤ p_to) dans le composant dashboard
- Propager `setStatsError(true)` dans le catch global de `load()`
- Distinguer état d'erreur vs état zéro pour KPIs Joueurs/Coachs/Groupes

---

## Story 63-3 — Section Développement — hub Prospection / Marketing / Partenariats

**Gate 1** : PASS (1 MEDIUM corrigé — rgba hardcodés → tokens `colors.border.goldBg` + `colors.border.gold`)
**Gate 2** : PASS (0 blocker, 4 warnings non bloquants)

### Findings Gate 1 (code review + design critic)

| ID | Sévérité | Description | Statut |
|----|----------|-------------|--------|
| MEDIUM-M1 | MEDIUM | 3 fichiers stub avec `rgba(193,172,92,0.10)` hardcodé en backgroundColor banner | CORRIGÉ — token `colors.border.goldBg` ajouté dans tokens.ts |

### Findings Gate 2 (UX / regression / bug hunting)

| ID | Catégorie | Sévérité | Description | Statut |
|----|-----------|----------|-------------|--------|
| W-UX-1 | UX | WARNING | `DevSectionCard` recréé localement au lieu de `@aureak/ui/Card` | Non bloquant — justifiable (Card sans Pressable) |
| W-UX-2 | UX | WARNING | fontSize hardcodés (valeurs numériques conformes aux tokens mais non importées via `typography.*`) | Non bloquant — dette cosmétique |
| W-UX-3 | UX | WARNING | `accessibilityLabel` manquant sur `Pressable` hub | Non bloquant — pages stub |
| W-BUG-1 | Bug | WARNING | `router.push(section.href as never)` — cast permissif, pattern projet établi | Non bloquant |

### Regression

Fichier partagé modifié : `packages/theme/src/tokens.ts` — ajout additif de `colors.border.goldBg`. Aucune régression sur les stories `done` existantes. TypeScript → 0 erreur.

### Dette technique identifiée

- Remplacer `as never` par les routes typées Expo Router si le type system est configuré
- Ajouter `accessibilityLabel` sur les `Pressable` cards hub lors de l'implémentation réelle
- Unifier les KPI cards avec un composant `@aureak/ui/KpiCard` lors de la story de contenu

---

## Règles de sévérité QA

- **BLOCKER** : doit être corrigé avant gate pass — bug visible, donnée erronée, sécurité
- **WARNING** : signalé, non bloquant — dette tech, amélioration UX, lint
- **OK** : conforme aux règles du projet
