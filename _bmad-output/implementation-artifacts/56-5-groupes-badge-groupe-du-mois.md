# Story 56.5 : Groupes — Badge groupe du mois

Status: done

## Story

En tant qu'administrateur,
Je veux que le groupe avec le meilleur taux de présence du mois écoulé reçoive un badge "Groupe du mois" visible sur sa card,
Afin de valoriser la régularité et créer une émulation positive entre les groupes.

## Contexte & Décisions de Design

### Calcul du groupe du mois
L'API `getTopGroupByAttendance(tenantId, period: 'month' | 'season')` retourne l'ID du groupe avec le taux de présence le plus élevé sur la période. Taux = (nb présences `present`) / (nb présences total) pour toutes les séances du groupe dans la période.

### Badge "Groupe du mois"
Badge "Groupe du mois" affiché en overlay sur la `GroupCard` :
- Position : coin supérieur gauche
- Style : pill gold avec trophée SVG + texte "Groupe du mois"
- Animation subtile : shimmer gold (brightness 1.0 → 1.3 → 1.0 sur 2s, loop infini)

### Un seul badge à la fois
Si deux groupes ont le même taux (ex. 100%), le plus ancien (created_at) reçoit le badge (stabilité du classement).

### Mise à jour
Le badge est recalculé à chaque chargement de la page (pas de cache persistant côté client). La valeur est stockée seulement en mémoire session.

## Acceptance Criteria

**AC1 — Badge visible sur la card du groupe leader**
- **Given** des séances avec présences enregistrées ce mois
- **When** la page `groups/index.tsx` est chargée
- **Then** la GroupCard du groupe avec le meilleur taux affiche un badge "Groupe du mois"
- **And** les autres GroupCards n'affichent pas ce badge

**AC2 — Calcul du taux correct**
- **Given** groupe A : 18 présents sur 20 séances (90%) et groupe B : 15 sur 15 (100%)
- **When** `getTopGroupByAttendance` est appelé
- **Then** le groupe B (100%) est retourné comme vainqueur
- **And** en cas d'égalité, le groupe le plus ancien (created_at ASC) est sélectionné

**AC3 — Animation shimmer sur le badge**
- **Given** le badge "Groupe du mois" visible
- **When** il est rendu
- **Then** une animation shimmer or subtile se joue en boucle (brightness ou opacity oscillante)
- **And** l'animation ne perturbe pas la lecture du texte du badge

**AC4 — Sélecteur de période (mois / saison)**
- **Given** la page groupes
- **When** un sélecteur "Mois en cours" / "Cette saison" est disponible
- **Then** changer la période recalcule quel groupe reçoit le badge
- **And** le changement est immédiat (chargement spinné si > 500ms)

**AC5 — Masquage si aucune donnée**
- **Given** aucune séance avec présences dans la période sélectionnée
- **When** la page est chargée
- **Then** aucun badge "Groupe du mois" n'est affiché
- **And** aucune erreur console

**AC6 — API getTopGroupByAttendance dans dashboard.ts**
- **Given** un appel à `getTopGroupByAttendance(tenantId, 'month')`
- **When** l'API est exécutée
- **Then** la réponse contient `{ groupId: string; groupName: string; attendanceRate: number } | null`
- **And** la requête inclut uniquement les séances non-annulées (status != 'cancelled')

## Tasks

- [ ] Créer `getTopGroupByAttendance(tenantId, period)` dans `@aureak/api-client/src/dashboard.ts`
- [ ] Requête SQL : GROUP BY group_id, HAVING COUNT(present), taux DESC, LIMIT 1, tie-break created_at
- [ ] Ajouter type `TopGroupResult = { groupId, groupName, attendanceRate } | null` dans `@aureak/types`
- [ ] Créer composant badge `GroupOfMonthBadge.tsx` dans `@aureak/ui` avec animation shimmer
- [ ] Intégrer badge dans `GroupCard.tsx` via prop `isGroupOfMonth: boolean`
- [ ] Charger `getTopGroupByAttendance` dans `groups/index.tsx` et passer la prop aux cards
- [ ] Sélecteur période mois/saison dans `groups/index.tsx`
- [ ] Masquage si API retourne null
- [ ] QA scan : try/finally, console guards
- [ ] Test Playwright : screenshot badge visible sur une card

## Fichiers concernés

- `aureak/packages/api-client/src/dashboard.ts` (getTopGroupByAttendance)
- `aureak/packages/types/src/entities.ts` (TopGroupResult)
- `aureak/packages/ui/src/GroupOfMonthBadge.tsx` (nouveau)
- `aureak/packages/ui/src/GroupCard.tsx` (prop isGroupOfMonth)
- `aureak/packages/ui/src/index.ts` (export GroupOfMonthBadge)
- `aureak/apps/web/app/(admin)/groups/index.tsx` (chargement + passage prop)

## Dépendances

- Story 56-1 (GroupCard) — requis (badge s'intègre dans GroupCard via prop)
- Table `presences` (ou `attendances`) existante avec `status` et `session_id`

## Notes techniques

- Animation shimmer CSS : `@keyframes shimmer { 0% { opacity: 1 } 50% { opacity: 0.6 } 100% { opacity: 1 } }` loop infinite 2s
- Requête SQL taux : `CAST(SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0)`
- `NULLIF(COUNT(*), 0)` évite la division par zéro
