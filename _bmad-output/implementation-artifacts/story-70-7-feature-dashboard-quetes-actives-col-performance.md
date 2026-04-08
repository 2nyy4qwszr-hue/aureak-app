# Story 70.7 : Feature — Quêtes actives dans colonne Performance

Status: done

## Story

En tant qu'admin,
je veux voir un bloc "Quêtes actives" dans la colonne PERFORMANCE du dashboard (entre le classement XP et le Score Académie),
afin d'avoir un aperçu des quêtes en cours comme dans la référence `dashboard-redesign.png`.

## Acceptance Criteria

1. Un bloc "Quêtes actives" s'affiche dans la colonne droite entre le classement XP et le Score Académie
2. Le titre du bloc est "Quêtes actives" en `fontSize: 11, fontWeight: 700, uppercase, colors.text.muted` — même style que les autres sous-titres de cards
3. Si aucune quête n'est disponible via l'API (retour vide ou erreur), le bloc affiche 2 quêtes placeholder statiques :
   - "Nettoyage Surface (U15)" avec une barre de progression à 50%
   - "Réflexes Gants Dorés" avec barre à 30% et label "14/38"
4. Si l'API `assign-weekly-quests` retourne des données, les afficher (max 3 quêtes)
5. Chaque ligne de quête : label tronqué (1 ligne) + barre de progression gold `colors.accent.gold` + compteur optionnel (ex: "14/38")
6. Un lien "Voir toutes les quêtes →" en `colors.accent.gold, fontSize: 12` s'affiche en bas du bloc
7. La card a fond `colors.light.surface`, border `colors.border.light`, shadow `shadows.sm`
8. TypeScript compile sans erreur

## Tasks / Subtasks

- [ ] T1 — Créer le composant `ActiveQuestsTile` inline dans `dashboard/page.tsx` (AC: 1-7)
  - [ ] T1.1 — Ajouter avant `LeaderboardTile` ou juste avant `AcademyScoreTile` un composant `ActiveQuestsTile` avec les props `quests: ActiveQuest[]` (ou tableau vide)
  - [ ] T1.2 — Définir le type local : `type ActiveQuest = { id: string; label: string; progress: number; total?: number; current?: number }`
  - [ ] T1.3 — Implémenter le rendu : card avec titre + liste quêtes (label + barre gold `height: 4px` + compteur) + lien
  - [ ] T1.4 — Définir les 2 quêtes placeholder statiques utilisées quand pas d'API : `const QUEST_PLACEHOLDERS: ActiveQuest[] = [{ id: 'q1', label: 'Nettoyage Surface (U15)', progress: 50 }, { id: 'q2', label: 'Réflexes Gants Dorés', progress: 37, current: 14, total: 38 }]`

- [ ] T2 — Intégrer dans la colonne droite (AC: 1)
  - [ ] T2.1 — Dans la col droite (ligne ~2967 et suivants), insérer `<ActiveQuestsTile quests={QUEST_PLACEHOLDERS} />` ENTRE le bloc Classement XP et `<AcademyScoreTile ... />`

- [ ] T3 — Validation (AC: tous)
  - [ ] T3.1 — `npx tsc --noEmit` = 0 erreurs
  - [ ] T3.2 — Naviguer sur `/dashboard` : le bloc "Quêtes actives" est visible avec 2 quêtes et leurs barres de progression

## Dev Notes

### ⚠️ Contraintes Stack

HTML/JSX natif. Le composant `ActiveQuestsTile` est défini inline dans `dashboard/page.tsx`.
Pas de nouvel appel API dans cette story — les quêtes sont en placeholder statique (l'API `assign-weekly-quests` est une Edge Function, pas une query React).

---

### T1 — Pattern `ActiveQuestsTile`

```tsx
type ActiveQuest = {
  id       : string
  label    : string
  progress : number   // 0-100
  current ?: number
  total   ?: number
}

const QUEST_PLACEHOLDERS: ActiveQuest[] = [
  { id: 'q1', label: 'Nettoyage Surface (U15)', progress: 50 },
  { id: 'q2', label: 'Réflexes Gants Dorés',   progress: 37, current: 14, total: 38 },
]

function ActiveQuestsTile({ quests }: { quests: ActiveQuest[] }) {
  const router = useRouter()
  const list = quests.length > 0 ? quests.slice(0, 3) : QUEST_PLACEHOLDERS

  return (
    <div style={{
      backgroundColor: colors.light.surface,
      borderRadius   : radius.card,
      border         : `1px solid ${colors.border.light}`,
      boxShadow      : shadows.sm,
      padding        : '16px 16px',
    }}>
      {/* Titre */}
      <div style={{
        fontSize     : 11,
        fontWeight   : 700,
        color        : colors.text.muted,
        textTransform: 'uppercase',
        letterSpacing: 1.1,
        marginBottom : 12,
        fontFamily   : 'Montserrat, sans-serif',
      }}>
        Quêtes actives
      </div>

      {/* Liste quêtes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map(q => (
          <div key={q.id}>
            <div style={{
              display        : 'flex',
              justifyContent : 'space-between',
              alignItems     : 'center',
              marginBottom   : 4,
            }}>
              <span style={{
                fontSize    : 12,
                color       : colors.text.dark,
                fontFamily  : 'Geist, sans-serif',
                overflow    : 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace  : 'nowrap',
                flex        : 1,
                paddingRight: 8,
              }}>
                {q.label}
              </span>
              {q.current !== undefined && q.total !== undefined && (
                <span style={{
                  fontSize  : 10,
                  fontWeight: 700,
                  color     : colors.text.muted,
                  fontFamily: 'Geist Mono, monospace',
                  flexShrink: 0,
                }}>
                  {q.current}/{q.total}
                </span>
              )}
            </div>
            {/* Barre de progression */}
            <div style={{ height: 4, backgroundColor: colors.border.divider, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height         : '100%',
                width          : `${Math.min(q.progress, 100)}%`,
                backgroundColor: colors.accent.gold,
                borderRadius   : 2,
                transition     : 'width 0.6s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Lien */}
      <button
        onClick={() => router.push('/quetes' as never)}
        style={{
          background : 'none',
          border     : 'none',
          cursor     : 'pointer',
          fontSize   : 12,
          fontWeight : 600,
          color      : colors.accent.gold,
          padding    : '8px 0 0 0',
          fontFamily : 'Montserrat, sans-serif',
          textAlign  : 'left',
        }}
      >
        Voir toutes les quêtes →
      </button>
    </div>
  )
}
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | Ajouter `ActiveQuestsTile` + intégrer dans col droite |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/` — pas d'API quêtes dans cette story
- `supabase/migrations/` — aucune migration

---

### Dépendances à protéger

- La position du `<AcademyScoreTile />` et du `<CountdownTile />` dans la col droite ne doit pas changer — `ActiveQuestsTile` s'insère ENTRE Classement XP et AcademyScoreTile uniquement

---

### Références

- Col droite : `dashboard/page.tsx` ligne ~2967
- Classement XP (repère de position) : `dashboard/page.tsx` ligne ~2974
- `AcademyScoreTile` (repère de position) : `dashboard/page.tsx` ligne ~3068
- Design ref : `_bmad-output/design-references/dashboard-redesign.png` (section "Quêtes actives")

---

### Multi-tenant

RLS gère l'isolation. Aucun changement DB.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | À modifier |
