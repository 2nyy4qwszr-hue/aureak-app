# Story 51.4 : Notification badges sidebar

Status: done

## Story

En tant qu'administrateur,
Je veux voir des pastilles de notification sur les items de navigation de la sidebar indiquant des actions urgentes ou des alertes contextuelles,
Afin de savoir immédiatement où porter mon attention sans avoir à visiter chaque section manuellement.

## Contexte & Décisions de Design

### Pastilles définies
Deux types de badges sur deux items spécifiques :

1. **Présences** (rouge) — pastille rouge avec compteur si des séances du jour ont été réalisées mais pas encore validées (présences non saisies)
2. **Séances** (or) — pastille or sans compteur si une séance est planifiée dans les prochaines 24 heures

### API `getNavBadgeCounts()`
Nouvelle fonction dans `aureak/packages/api-client/src/admin/dashboard.ts` qui retourne :
```typescript
interface NavBadgeCounts {
  presencesUnvalidated: number  // séances réalisées sans présences complètes
  sessionsUpcoming24h : boolean // true si au moins 1 séance dans 24h
}
```

### Polling
Poll toutes les 5 minutes — assez fréquent pour être utile, sans surcharger l'API.

### Position du badge
Badge positionné en absolute sur l'item nav, coin supérieur droit de l'icône. En mode collapsed, le badge reste visible (essentiel car l'icône seule doit toujours informer).

### Couleurs
- Rouge `colors.status.absent` (#F44336) — badge présences
- Or `colors.accent.gold` (#C1AC5C) — badge séances

## Acceptance Criteria

**AC1 — Badge rouge Présences : séances non validées**
- **Given** au moins une séance du jour a le statut `'réalisée'` mais possède des `session_attendees` sans statut (NULL)
- **When** l'admin regarde la sidebar
- **Then** un badge rouge circulaire s'affiche sur l'item "Présences" avec le nombre de séances concernées
- **And** si 0 séance non validée → aucun badge affiché

**AC2 — Badge or Séances : séance dans 24h**
- **Given** au moins une séance a le statut `'planifiée'` avec `scheduled_at` dans les prochaines 24 heures
- **When** l'admin regarde la sidebar
- **Then** un badge doré sans compteur (point) s'affiche sur l'item "Séances"
- **And** si aucune séance dans 24h → aucun badge affiché

**AC3 — Badge visible en mode collapsed**
- **Given** la sidebar est en mode collapsed (icônes uniquement)
- **When** un badge est actif
- **Then** le badge reste visible, positionné en coin supérieur droit de l'icône
- **And** l'information est donc accessible même sidebar fermée

**AC4 — Polling toutes les 5 minutes**
- **Given** le layout admin est monté
- **When** 5 minutes s'écoulent
- **Then** `getNavBadgeCounts()` est rappelé et les badges mis à jour
- **And** le `setInterval` est clearé au unmount

**AC5 — Try/finally et console guard**
- **Given** l'appel `getNavBadgeCounts()` échoue
- **When** l'erreur est catchée
- **Then** l'erreur est loggée avec `if (process.env.NODE_ENV !== 'production') console.error(...)`
- **And** les badges restent dans leur dernier état connu (pas d'effacement brutal)

**AC6 — Badge taille et position conformes**
- **Given** un badge est actif
- **When** l'admin voit l'item nav
- **Then** le badge fait 16×16px (avec compteur) ou 8×8px (point) selon le type
- **And** le badge est positionné en `position: absolute`, `top: -4`, `right: -2` par rapport à l'icône

**AC7 — Aucun badge si admin n'a pas de séances dans son périmètre**
- **Given** le tenant n'a aucune séance planifiée ou réalisée
- **When** les badges sont calculés
- **Then** aucun badge n'est affiché (état propre)

## Tasks / Subtasks

- [x] Task 1 — API `getNavBadgeCounts()` dans dashboard.ts
  - [x] 1.1 Ajouter `getNavBadgeCounts(tenantId: string): Promise<NavBadgeCounts>` dans `aureak/packages/api-client/src/admin/dashboard.ts`
  - [x] 1.2 Requête présences non validées : sessions avec statut `'réalisée'` + COUNT attendees avec status NULL
  - [x] 1.3 Requête séances 24h : sessions statut `'planifiée'` avec `scheduled_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'`
  - [x] 1.4 Exporter `getNavBadgeCounts` et interface `NavBadgeCounts` depuis `@aureak/api-client/src/index.ts`

- [x] Task 2 — Type `NavBadgeCounts` dans `@aureak/types`
  - [x] 2.1 Ajouter dans `aureak/packages/types/src/entities.ts`

- [x] Task 3 — Composant `NavBadge` dans `@aureak/ui` ou composant local
  - [x] 3.1 Créer `aureak/apps/web/components/NavBadge.tsx`
  - [x] 3.2 Props : `count?: number` (si fourni → badge chiffré), `dot?: boolean` (si true → point simple), `color: string`
  - [x] 3.3 Rendu : span positionné absolute, cercle, texte blanc centré si count
  - [x] 3.4 Sizes : dot = 8×8, chiffré = 16×16 (ou 20×16 si 2 chiffres)

- [x] Task 4 — Intégration dans `_layout.tsx`
  - [x] 4.1 Ajouter state `navBadges: NavBadgeCounts | null`
  - [x] 4.2 Appel initial + `setInterval(5 * 60 * 1000)` + cleanup
  - [x] 4.3 navBadges passé directement dans le rendu inline des items nav
  - [x] 4.4 Dans le rendu des items nav, wrapper `Icon` dans une `YStack` avec `position: 'relative'`
  - [x] 4.5 Conditionner le rendu `<NavBadge />` selon `href` — présences et séances
  - [x] 4.6 Badge visible dans les deux modes collapsed/expanded

- [x] Task 5 — QA
  - [x] 5.1 Console guard sur le catch
  - [x] 5.2 Try/finally non applicable ici (pas de state loading UI) — vérifié
  - [x] 5.3 `npx tsc --noEmit` sans erreur

## Dev Notes

### Requêtes SQL indicatives

```typescript
// Présences non validées
const { data: unvalidated } = await supabase
  .from('sessions')
  .select('id, session_attendees!inner(status)')
  .eq('tenant_id', tenantId)
  .eq('status', 'réalisée')
  .is('session_attendees.status', null)

// Séances dans 24h
const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
const { count } = await supabase
  .from('sessions')
  .select('id', { count: 'exact', head: true })
  .eq('tenant_id', tenantId)
  .eq('status', 'planifiée')
  .gte('scheduled_at', new Date().toISOString())
  .lte('scheduled_at', in24h)
```

### Positionnement badge en mode collapsed vs expanded

En mode **expanded** : le badge est sur l'icône (`position: relative` → badge absolute).
En mode **collapsed** : identique, mais le conteneur item est plus petit — le badge doit rester en coin supérieur droit.
Solution : wrapper `<View style={{ position: 'relative' }}>` autour de l'icône dans les deux modes.

## File List

### New Files
- `aureak/apps/web/app/components/NavBadge.tsx` — composant badge sidebar

### Modified Files
- `aureak/packages/api-client/src/admin/dashboard.ts` — `getNavBadgeCounts()`
- `aureak/packages/api-client/src/index.ts` — export `getNavBadgeCounts`, `NavBadgeCounts`
- `aureak/packages/types/src/entities.ts` — interface `NavBadgeCounts`
- `aureak/apps/web/app/(admin)/_layout.tsx` — state navBadges + polling + rendu `<NavBadge />`

## Dev Agent Record

- [x] Story créée le 2026-04-04
- [x] Implémentée le 2026-04-05
- [x] Dépendances : Story 51-1 (icônes SVG — badge positionné relative à l'icône)

## Change Log

- 2026-04-04 : Story créée — Epic 51, Navigation & Shell Game HUD
