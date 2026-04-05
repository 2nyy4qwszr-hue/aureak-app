# QA Summary — Aureak

Dernière mise à jour : 2026-04-05

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

## Règles de sévérité QA

- **BLOCKER** : doit être corrigé avant gate pass — bug visible, donnée erronée, sécurité
- **WARNING** : signalé, non bloquant — dette tech, amélioration UX, lint
- **OK** : conforme aux règles du projet
