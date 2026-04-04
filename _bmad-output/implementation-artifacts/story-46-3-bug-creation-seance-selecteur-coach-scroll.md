# Story 46.3 : BUG — Création séance — sélecteur coach scroll broken

Status: done

## Story

En tant qu'admin Aureak créant une séance,
je veux pouvoir scroller et sélectionner un coach dans le sélecteur de l'étape de création de séance,
afin d'assigner correctement un coach à la séance.

## Acceptance Criteria

1. Le sélecteur de coach dans `seances/new.tsx` permet de scroller la liste des coaches disponibles
2. Chaque coach dans la liste est correctement affiché avec son nom complet et son rôle
3. La sélection d'un coach fonctionne au clic/tap
4. Le sélecteur est visuellement cohérent avec le design system (tokens @aureak/theme)
5. Sur mobile et desktop, le scroll fonctionne sans blocage

## Tasks / Subtasks

- [x] T1 — Diagnostiquer le sélecteur coach
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/seances/new.tsx` — identifier le composant de sélection des coaches
  - [x] T1.2 — Identifier si le problème est : hauteur fixe sans overflow, z-index, ou conteneur parent avec overflow:hidden

- [x] T2 — Corriger le scroll
  - [x] T2.1 — Si liste dans un conteneur fixe : ajouter `overflow: 'auto'` ou `overflowY: 'auto'` avec `maxHeight`
  - [x] T2.2 — Si ScrollView React Native : vérifier que `nestedScrollEnabled={true}` est présent pour les listes imbriquées
  - [x] T2.3 — Assurer que le conteneur parent n'a pas `overflow: 'hidden'` qui bloquerait le scroll enfant
  - [x] T2.4 — Redesign visuel si nécessaire : liste compacte avec `paddingVertical: 8`, séparatrice fine, hover state

- [x] T3 — Validation
  - [x] T3.1 — `npx tsc --noEmit` → zéro erreur
  - [x] T3.2 — Tester avec 5+ coaches → scroll fonctionne, sélection OK

## Dev Notes

### Pattern liste scrollable
```typescript
<View style={{ maxHeight: 200, overflow: 'auto' }}>
  {coaches.map(coach => (
    <Pressable key={coach.id} onPress={() => selectCoach(coach)}
      style={({ pressed }) => [styles.coachRow, pressed && styles.coachRowPressed]}>
      <Text>{coach.displayName}</Text>
      <Text style={styles.roleLabel}>{coach.role}</Text>
    </Pressable>
  ))}
</View>
```

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/new.tsx` | Fix scroll sélecteur coach |

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Completion Notes List
- **Diagnostic** : Le bug se produit sur React Native Web — les composants `MultiSearchableSelect` (sélecteur coach) et `SearchableSelect` utilisent un `ScrollView` avec `maxHeight: 220` imbriqué dans le `ScrollView` principal de la page. Sur web, les ScrollView imbriqués ne scrollent pas correctement car les événements scroll se propagent au parent.
- **Correction** : Ajout de `overflow: 'auto' as never` dans le style du `ScrollView` dropdown lorsque `Platform.OS === 'web'`. Sur React Native Web, ce style CSS est appliqué directement au div sous-jacent, permettant le scroll natif CSS sans conflit avec le ScrollView parent. Correction appliquée aux deux composants : `SearchableSelect` et `MultiSearchableSelect`.
- **Pas de régression** : `npx tsc --noEmit` → 0 erreur. Styles via tokens uniquement, try/finally et console guards inchangés.

### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/new.tsx` | modifié |
