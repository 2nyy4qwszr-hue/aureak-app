# Story 65-6 — Présences : Vue Joueur inline (suppression redirection silencieuse)

**Epic** : 65 — Activités Hub Unifié  
**Status** : done  
**Priority** : P1 — UX bloquante (perte de contexte)  
**Type** : UX fix + feature  
**Dépendances** : 65-2 (done — la page `presences/page.tsx` implémentée)

---

## Contexte & Problème

Quand l'admin sélectionne le scope "Joueur" dans l'onglet Présences (`/activites/presences`), un `useEffect` exécute immédiatement `router.push('/(admin)/children/' + scope.childId)`, téléportant l'utilisateur hors de la page Activités sans aucun avertissement ni opt-in.

**Conséquences** :
- Perte du contexte Activités > Présences
- Fil d'Ariane cassé (l'utilisateur ne sait plus comment revenir)
- Comportement incohérent avec les autres scopes (groupe, implantation) qui restent dans la page
- Inutilisable pour une consultation rapide du profil de présences d'un joueur

---

## Solution

Remplacer la redirection automatique par une **Vue Joueur inline** dans la même page. La navigation vers la fiche complète devient un lien opt-in explicite.

---

## Acceptance Criteria

### AC1 — Plus de redirection automatique
Quand `scope.scope === 'joueur' && scope.childId` est défini, la page **ne navigue plus** automatiquement vers `/(admin)/children/[id]`. Le `useEffect` de redirection est supprimé.

### AC2 — Vue Joueur inline complète
La page affiche une section "Vue Joueur" composée de :

**Card résumé joueur** (en haut de la vue) :
- Avatar initiales 32px (fond `colors.dark.surface`, texte gold) contenant les 2 premières lettres du `displayName`
- Nom du joueur (`displayName`)
- Groupe actuel : `groupName` de la première présence (ou "—" si aucune)
- Taux d'assiduité global calculé sur les présences chargées (présent + retard / total)

**Timeline des 10 dernières séances** :
- Une ligne par séance : dot coloré par statut + date formatée (`formatSessionDate`)
- Statuts → couleurs via `getDotColor()` (existant dans le fichier) : présent=vert, absent=rouge, retard=orange, blessé=bleu
- Ordre : du plus récent au plus ancien (`.slice(0, 10)` après tri `sessionDate` DESC)
- Si aucune séance → message "Aucune séance enregistrée"

**Statistiques** :
- "Assiduité 30 jours" : taux sur les présences dont `sessionDate >= today - 30j`
- "Assiduité totale" : taux sur toutes les présences chargées

**Lien opt-in** :
- Texte "Voir la fiche complète →"
- Couleur `colors.accent.gold` / style discreet
- `onPress` → `router.push('/(admin)/children/' + childId)`
- Positionné en bas de la Vue Joueur

### AC3 — État vide si aucun joueur sélectionné
Quand `scope.scope === 'joueur'` mais `scope.childId` est `undefined` ou `null`, afficher un message centré :

> "Sélectionner un joueur dans le filtre ci-dessus"

Avec un sous-texte :
> "Utilisez le filtre Scope > Joueur pour chercher un joueur par nom."

### AC4 — Chargement avec try/finally
Le chargement des données joueur (`getChildDirectoryEntry` + `listAttendancesByChild`) est géré avec un state `loadingPlayer` initialisé à `false`, enveloppé dans un `try/finally` obligatoire. Un spinner/texte "Chargement…" s'affiche pendant le fetch.

### AC5 — Période par défaut 12 mois
`listAttendancesByChild` reçoit comme `startDate` = `today - 365 jours` et `endDate` = `today` (ISO string). La période n'est pas configurable dans cette story — c'est un défaut raisonnable pour une vue de synthèse.

### AC6 — Comportement des autres scopes inchangé
Les vues global, implantation et groupe continuent de fonctionner exactement comme avant. Le clic sur un joueur dans la heatmap (`handleClickPlayer`) redirige **toujours** vers la fiche — ce comportement n'est PAS modifié (c'est une action explicite de l'utilisateur). Seul le `useEffect` de redirection auto en scope "joueur" est supprimé.

---

## Tasks

### Task 1 — Supprimer la redirection automatique

Fichier : `aureak/apps/web/app/(admin)/activites/presences/page.tsx`

- [ ] Supprimer le `useEffect` aux lignes 771-775 :
  ```typescript
  // À supprimer entièrement
  useEffect(() => {
    if (scope.scope === 'joueur' && scope.childId) {
      router.push(`/(admin)/children/${scope.childId}` as Parameters<typeof router.push>[0])
    }
  }, [scope, router])
  ```

### Task 2 — Ajouter les imports nécessaires

- [ ] Ajouter dans les imports `@aureak/api-client` :
  ```typescript
  import {
    // ... imports existants ...
    listAttendancesByChild,
    getChildDirectoryEntry,
  } from '@aureak/api-client'
  import type { AttendanceHistoryRow } from '@aureak/api-client'
  ```
- [ ] Vérifier que `AttendanceHistoryRow` est bien exporté depuis `@aureak/api-client` (confirmé : ligne 168 + 773 de `attendances.ts`)
- [ ] Vérifier que `getChildDirectoryEntry` est bien exporté (confirmé : ligne 399 de `index.ts`)

### Task 3 — Ajouter les states joueur

Dans le composant principal `PresencesPage` :

- [ ] Ajouter les states :
  ```typescript
  const [loadingPlayer,  setLoadingPlayer]  = useState(false)
  const [playerEntry,    setPlayerEntry]    = useState<import('@aureak/types').ChildDirectoryEntry | null>(null)
  const [playerHistory,  setPlayerHistory]  = useState<AttendanceHistoryRow[]>([])
  ```

### Task 4 — Ajouter le useEffect de chargement joueur

- [ ] Ajouter un `useEffect` déclenché sur `scope` :
  ```typescript
  useEffect(() => {
    if (scope.scope !== 'joueur' || !scope.childId) {
      setPlayerEntry(null)
      setPlayerHistory([])
      return
    }
    setLoadingPlayer(true)
    ;(async () => {
      try {
        const today     = new Date()
        const startDate = new Date(today)
        startDate.setFullYear(today.getFullYear() - 1)

        const [entry, history] = await Promise.all([
          getChildDirectoryEntry(scope.childId!),
          listAttendancesByChild(
            scope.childId!,
            startDate.toISOString().split('T')[0],
            today.toISOString().split('T')[0],
          ),
        ])
        setPlayerEntry(entry)
        setPlayerHistory(history)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PresencesPage] loadPlayerData error:', err)
      } finally {
        setLoadingPlayer(false)
      }
    })()
  }, [scope])
  ```

### Task 5 — Créer le composant `VueJoueurInline`

Dans le même fichier `presences/page.tsx`, avant le composant `PresencesPage`, ajouter un composant fonctionnel :

```typescript
type VueJoueurInlineProps = {
  childId      : string
  loading      : boolean
  entry        : import('@aureak/types').ChildDirectoryEntry | null
  history      : AttendanceHistoryRow[]
  onViewFull   : () => void
}

function VueJoueurInline({ childId, loading, entry, history, onViewFull }: VueJoueurInlineProps) {
  // ...
}
```

**Contenu du composant** :

- [ ] Si `loading` → afficher `<AureakText>Chargement…</AureakText>` centré
- [ ] Si `!entry` et `!loading` → afficher `<AureakText>Joueur introuvable.</AureakText>`
- [ ] Sinon → afficher la vue complète :

**Card résumé** :
  - Row : Avatar + infos droite
  - Avatar : `View` 32px×32px, `borderRadius: 16`, `backgroundColor: colors.dark.surface`, texte initiales (2 premiers caractères de `entry.displayName.toUpperCase()`) en `colors.accent.gold`, `fontSize: 13`, `fontWeight: '700'`
  - Nom : `AureakText` `fontSize: 16`, `fontWeight: '700'`, `color: colors.text.primary`
  - Groupe : `AureakText` `fontSize: 12`, `color: colors.text.muted` — valeur : `history[0]?.groupName ?? '—'`
  - Taux global : `AureakText` `fontSize: 12`, `color: colors.text.muted` — calculé : `Math.round((history.filter(h => h.status === 'present' || h.status === 'late').length / Math.max(history.length, 1)) * 100)` + `%`

**Timeline 10 dernières séances** :
  - Titre section : `<AureakText>10 dernières séances</AureakText>`
  - Trier `history` par `sessionDate` DESC, prendre les 10 premiers
  - Pour chaque item : row avec dot `8px×8px borderRadius:4` couleur `getDotColor(item.status)` + `<AureakText>{formatSessionDate(item.sessionDate)}</AureakText>` + `<AureakText>{item.status}</AureakText>`
  - Si `history.length === 0` → `<AureakText>Aucune séance enregistrée</AureakText>`

**Stats 30j / totale** :
  - Calculer `rate30` : présences dont `sessionDate >= today-30j` / total dans ces 30j
  - Row 2 cards : "Assiduité 30 jours" + valeur / "Assiduité totale" + valeur
  - Style identique aux stat cards existantes (`cardStyles.card`)

**Lien opt-in** :
  - `<Pressable onPress={onViewFull}>` → `<AureakText style={{ color: colors.accent.gold }}>Voir la fiche complète →</AureakText>`
  - Aligné à droite, `marginTop: space.md`

### Task 6 — Intégrer `VueJoueurInline` dans le rendu principal

Dans la section de rendu de `PresencesPage`, **remplacer** la logique conditionnelle qui affichait uniquement les vues global/implantation/groupe, pour ajouter la branche `joueur` :

- [ ] Ajouter la condition avant les vues existantes :
  ```typescript
  {scope.scope === 'joueur' ? (
    scope.childId ? (
      <VueJoueurInline
        childId={scope.childId}
        loading={loadingPlayer}
        entry={playerEntry}
        history={playerHistory}
        onViewFull={() => router.push(`/(admin)/children/${scope.childId}` as Parameters<typeof router.push>[0])}
      />
    ) : (
      <View style={emptyPlayerStyles.container}>
        <AureakText style={emptyPlayerStyles.title}>
          Sélectionner un joueur dans le filtre ci-dessus
        </AureakText>
        <AureakText style={emptyPlayerStyles.sub}>
          Utilisez le filtre Scope › Joueur pour chercher un joueur par nom.
        </AureakText>
      </View>
    )
  ) : (
    // ... vues global / implantation / groupe existantes ...
  )}
  ```

### Task 7 — Ajouter les styles manquants

- [ ] Ajouter `emptyPlayerStyles` dans le StyleSheet :
  ```typescript
  const emptyPlayerStyles = StyleSheet.create({
    container: {
      flex          : 1,
      alignItems    : 'center',
      justifyContent: 'center',
      paddingVertical: space.xxl,
      gap           : space.sm,
    },
    title: {
      fontSize  : 16,
      fontWeight: '600',
      color     : colors.text.primary,
      textAlign : 'center',
    },
    sub: {
      fontSize: 13,
      color   : colors.text.muted,
      textAlign: 'center',
    },
  })
  ```
- [ ] Ajouter `vueJoueurStyles` dans le StyleSheet pour les éléments internes du composant `VueJoueurInline` (avatar, timeline item, stats row, lien)

---

## Fichiers modifiés

| Fichier | Action |
|---|---|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Modifier — supprimer useEffect redirection, ajouter composant VueJoueurInline + states + useEffect chargement |

**Aucune migration DB.** Aucun changement `@aureak/api-client`, `@aureak/types`, `@aureak/theme`.

---

## QA Checklist post-implémentation

- [ ] `grep -n "router.push.*children.*scope\|useEffect.*joueur.*router" presences/page.tsx` → 0 résultat (redirection auto supprimée)
- [ ] `grep -n "setLoadingPlayer(false)" presences/page.tsx` → présent UNIQUEMENT dans un bloc `finally`
- [ ] `grep -n "console\." presences/page.tsx | grep -v "NODE_ENV"` → 0 résultat
- [ ] Scope global → vue groupes×séances inchangée
- [ ] Scope groupe → heatmap + clic joueur redirige encore vers fiche (comportement explicite maintenu)
- [ ] Scope joueur sans sélection → message "Sélectionner un joueur…"
- [ ] Scope joueur avec sélection → Vue Joueur inline visible, pas de navigation
- [ ] Clic "Voir la fiche complète →" → navigation vers `/children/[id]`
- [ ] Pas de crash si joueur sans historique de présences

---

## Notes techniques

- `listAttendancesByChild` accepte `startDate`/`endDate` en format `YYYY-MM-DD` (ISO date uniquement, pas datetime)
- `getChildDirectoryEntry` retourne `null` si le joueur n'existe pas ou est soft-deleted
- Le composant `VueJoueurInline` doit être défini **avant** `PresencesPage` dans le fichier pour éviter les forward-reference issues
- Les fonctions `formatSessionDate` et `getDotColor` sont déjà définies dans le fichier et peuvent être utilisées directement
- Le type `ChildDirectoryEntry` est importable depuis `@aureak/types`
- `AttendanceHistoryRow` est exporté depuis `@aureak/api-client` (re-export de `sessions/attendances.ts`)
