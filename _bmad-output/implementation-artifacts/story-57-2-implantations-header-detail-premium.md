# Story 57-2 — Implantations : Header page détail premium enrichi

**Epic** : 57 — Implantations "Facilities Manager"
**Status** : done
**Priority** : medium
**Effort** : S (quelques heures)

---

## Contexte

Story 49-6 a introduit un composant `ImplantationDetail` avec un header 200px. Cette story enrichit ce header avec : hauteur portée à 280px, badge de capacité (joueurs actuels / max_players), bouton d'édition rapide inline dans l'overlay, et un traitement typographique premium (nom en display/900 avec text-shadow fort).

---

## User Story

**En tant qu'** administrateur Aureak,
**je veux** voir un header visuel premium sur la fiche d'implantation avec la capacité affichée et un accès rapide à l'édition,
**afin d'** évaluer d'un coup d'œil la saturation d'un site et modifier ses informations sans quitter la vue.

---

## Acceptance Criteria

- [ ] AC1 — Le header de `ImplantationDetail` est porté à **280px** de hauteur (valeur token ou constante locale `DETAIL_HEADER_HEIGHT = 280`)
- [ ] AC2 — Un badge **capacité** est affiché en haut-droite de l'overlay : `{joueurs_actuels} / {max_players}` si `max_players` est défini sur l'implantation ; sinon le badge affiche uniquement le nombre de joueurs actuels sans fraction
- [ ] AC3 — Le badge capacité change de couleur selon le taux de remplissage : vert (`colors.status.success`) < 70 %, or (`colors.accent.gold`) < 90 %, rouge (`colors.accent.red`) ≥ 90 % — logique extraite dans une fonction pure `getCapacityColor(current, max)`
- [ ] AC4 — Un bouton "✏ Modifier" est positionné en haut-droite (sous le badge capacité ou côte à côte) dans l'overlay ; son `onPress` déclenche la prop `onEdit` (passée depuis la page principale) qui ouvre le mode édition inline de l'implantation
- [ ] AC5 — Le nom de l'implantation s'affiche en typographie `fontWeight: '900'`, `fontSize: 28`, avec `textShadowColor: 'rgba(0,0,0,0.6)'` et `textShadowRadius: 8` pour la lisibilité sur photo sombre ou claire
- [ ] AC6 — L'adresse s'affiche sous le nom en `fontSize: 13`, `color: 'rgba(255,255,255,0.80)'`, avec une icône pin `📍` préfixée
- [ ] AC7 — Le gradient overlay bas couvre les 60 % inférieurs du header (`linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.20) 60%, transparent 100%)`) pour garantir la lisibilité du texte sur toute photo
- [ ] AC8 — Si aucune photo n'est définie, le gradient terrain existant est enrichi d'un motif de lignes de terrain (SVG inline ou background CSS `repeating-linear-gradient`) pour le différencier du simple vert uni
- [ ] AC9 — Zéro hardcode de couleur ou espacement hors de la logique photo/overlay — tokens `@aureak/theme` partout
- [ ] AC10 — `try/finally` sur tous les setters de chargement ; `console.error` guardé

---

## Tasks

### T1 — Ajout `maxPlayers` sur le type `Implantation` et la migration

Vérifier si la colonne `max_players` existe déjà sur `implantations`. Si non, créer la migration :

Fichier : `supabase/migrations/00117_implantations_max_players.sql`

```sql
-- Story 57-2 — Capacité maximale par implantation
ALTER TABLE implantations
  ADD COLUMN IF NOT EXISTS max_players INT NULL;

COMMENT ON COLUMN implantations.max_players IS
  'Capacité maximale de joueurs simultanés sur ce site (NULL = illimitée)';
```

Mettre à jour le type TS `Implantation` dans `aureak/packages/types/src/entities.ts` :
```typescript
maxPlayers : number | null   // ← Story 57-2
```

Mettre à jour `mapImplantation` dans `api-client/src/sessions/implantations.ts` :
```typescript
maxPlayers: (row.max_players as number | null) ?? null,
```

- [ ] Migration `00117` créée (si colonne absente)
- [ ] Type TS mis à jour
- [ ] `mapImplantation` mis à jour

### T2 — Fonction `getCapacityColor`

Fichier : `aureak/apps/web/app/(admin)/implantations/index.tsx` (helper local)

```typescript
function getCapacityColor(current: number, max: number | null): string {
  if (!max || max <= 0) return colors.accent.gold
  const ratio = current / max
  if (ratio >= 0.90) return colors.accent.red
  if (ratio >= 0.70) return colors.accent.gold
  return colors.status.success
}
```

- [ ] `getCapacityColor` ajouté

### T3 — Enrichissement du composant `ImplantationDetail`

Fichier : `aureak/apps/web/app/(admin)/implantations/index.tsx`

Ajouter prop `onEdit: () => void` sur `ImplantationDetail`.

Modifier le header :
- Hauteur → 280px
- Gradient overlay enrichi (60 % bas)
- Badge capacité avec couleur dynamique
- Bouton "✏ Modifier"
- Typographie nom 28/900 avec text-shadow fort
- Adresse avec icône pin

- [ ] Header porté à 280px
- [ ] Badge capacité dynamique implémenté
- [ ] Bouton "✏ Modifier" fonctionnel
- [ ] Typographie et overlay mis à jour

### T4 — Fallback gradient terrain enrichi

Dans la branche `!impl.photoUrl`, remplacer le `linear-gradient` uni par :
```
background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 50%, #1a472a 100%)'
```
avec une surcouche SVG lignes de terrain :
```tsx
<View style={[detailStyles.headerBg, { overflow: 'hidden' }]}>
  {/* lignes terrain SVG */}
  <View style={{
    position: 'absolute', inset: 0,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 38px, rgba(255,255,255,0.05) 38px, rgba(255,255,255,0.05) 40px)',
  } as any} />
</View>
```

- [ ] Fallback gradient enrichi implémenté

---

## Dépendances

- Story 49-6 `done` — `ImplantationDetail` existant
- Story 57-3 (parallèle possible) — `getCapacityColor` peut être partagée

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00117_implantations_max_players.sql` | Créer (si absent) |
| `aureak/packages/types/src/entities.ts` | Modifier — `maxPlayers` |
| `aureak/packages/api-client/src/sessions/implantations.ts` | Modifier — mapper `maxPlayers` |
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | Modifier — T2 + T3 + T4 |

---

## QA post-story

```bash
grep -n "console\." aureak/apps/web/app/(admin)/implantations/index.tsx | grep -v "NODE_ENV"
grep -n "hardcoded\|#[0-9A-Fa-f]\{3,6\}" aureak/apps/web/app/(admin)/implantations/index.tsx | grep -v "terrain\|overlay\|gradient"
```

---

## Commit message cible

```
feat(epic-57): story 57-2 — implantations header detail 280px + capacité badge + bouton éditer
```
