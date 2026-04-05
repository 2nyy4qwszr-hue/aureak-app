# Story 57-3 — Implantations : Barre de capacité colorée

**Epic** : 57 — Implantations "Facilities Manager"
**Status** : done
**Priority** : medium
**Effort** : S (quelques heures)

---

## Contexte

Les implantations peuvent avoir une capacité max (`max_players`, introduit en story 57-2). Cette story affiche une barre de remplissage visuelle sur `ImplantationCard` avec code couleur sémantique pour permettre à l'admin de détecter les sites saturés d'un coup d'œil sur la grille.

---

## User Story

**En tant qu'** administrateur Aureak,
**je veux** voir une barre de remplissage colorée sur chaque card d'implantation,
**afin de** détecter immédiatement les sites proches de la saturation sans ouvrir la fiche détail.

---

## Acceptance Criteria

- [ ] AC1 — `ImplantationCard` affiche une barre de progression horizontale en bas de la zone informations (sous les chips groupes) lorsque `impl.maxPlayers` est défini et supérieur à 0
- [ ] AC2 — La largeur de la barre est calculée en % : `Math.min((currentCount / maxPlayers) * 100, 100)` où `currentCount` = nombre total de joueurs dans tous les groupes de l'implantation
- [ ] AC3 — La barre est verte (`colors.status.success`) si taux < 70 %, or (`colors.accent.gold`) si 70 % ≤ taux < 90 %, rouge (`colors.accent.red`) si taux ≥ 90 %
- [ ] AC4 — La barre repose sur un fond gris clair (`colors.border.light`) pleine largeur pour matérialiser les 100 %
- [ ] AC5 — Un label texte accompagne la barre : `{currentCount} / {maxPlayers} joueurs` en `variant="caption"` `colors.text.muted` aligné à droite au-dessus de la barre
- [ ] AC6 — Si `impl.maxPlayers` est null ou 0, la barre et le label ne s'affichent pas (aucune régression sur les implantations sans capacité définie)
- [ ] AC7 — La fonction pure `getCapacityColor(current, max)` est partagée avec story 57-2 (ou dupliquée localement si 57-2 n'est pas encore `done`)
- [ ] AC8 — La barre a une hauteur de 4px, `borderRadius: radius.xs`, transition CSS `width 0.3s ease` (via `style` inline web)
- [ ] AC9 — Zéro hardcode — tokens `@aureak/theme` pour couleurs, `radius`, `space`
- [ ] AC10 — Aucune nouvelle requête API — `currentCount` calculé à partir du state `membersByGroup` déjà chargé en page principale et passé en prop à `ImplantationCard`

---

## Tasks

### T1 — Prop `currentMemberCount` sur `ImplantationCard`

Fichier : `aureak/apps/web/app/(admin)/implantations/index.tsx`

Ajouter la prop `currentMemberCount: number` sur `ImplantationCard`. Dans la page principale, calculer :
```typescript
const currentMemberCount = (groups[impl.id] ?? []).reduce(
  (total, g) => total + (membersByGroup[g.id]?.length ?? 0), 0
)
```

- [ ] Prop `currentMemberCount` ajoutée et calculée dans la page principale

### T2 — Barre de progression dans `ImplantationCard`

Après la section chips groupes, ajouter :
```tsx
{impl.maxPlayers && impl.maxPlayers > 0 && (
  <View style={{ gap: space.xs, marginTop: space.xs }}>
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
      <AureakText variant="caption" style={{ color: colors.text.muted }}>
        {currentMemberCount} / {impl.maxPlayers} joueurs
      </AureakText>
    </View>
    <View style={{
      height: 4,
      backgroundColor: colors.border.light,
      borderRadius: radius.xs,
      overflow: 'hidden',
    }}>
      <View style={{
        height: '100%',
        width: `${Math.min((currentMemberCount / impl.maxPlayers) * 100, 100)}%`,
        backgroundColor: getCapacityColor(currentMemberCount, impl.maxPlayers),
        borderRadius: radius.xs,
        transition: 'width 0.3s ease',
      } as any} />
    </View>
  </View>
)}
```

- [ ] Barre de progression ajoutée dans `ImplantationCard`

### T3 — Fonction `getCapacityColor` (si story 57-2 non encore done)

Si 57-2 n'est pas encore implémentée, ajouter localement dans `index.tsx` :
```typescript
function getCapacityColor(current: number, max: number | null): string {
  if (!max || max <= 0) return colors.accent.gold
  const ratio = current / max
  if (ratio >= 0.90) return colors.accent.red
  if (ratio >= 0.70) return colors.accent.gold
  return colors.status.success
}
```

- [ ] `getCapacityColor` disponible (partagée depuis 57-2 ou dupliquée)

---

## Dépendances

- Story 49-6 `done` — `ImplantationCard` existante + `membersByGroup` state
- Story 57-2 (optionnelle) — `max_players` migration + type TS `maxPlayers` — si non done, inclure la migration ici

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00117_implantations_max_players.sql` | Créer si 57-2 non done |
| `aureak/packages/types/src/entities.ts` | Modifier si 57-2 non done |
| `aureak/packages/api-client/src/sessions/implantations.ts` | Modifier si 57-2 non done |
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | Modifier — barre de progression |

---

## QA post-story

```bash
grep -n "console\." aureak/apps/web/app/(admin)/implantations/index.tsx | grep -v "NODE_ENV"
# Vérifier absence de hardcode couleur
grep -n "'#[0-9A-Fa-f]'" aureak/apps/web/app/(admin)/implantations/index.tsx
```

---

## Commit message cible

```
feat(epic-57): story 57-3 — implantations barre capacité vert/or/rouge sur card
```
