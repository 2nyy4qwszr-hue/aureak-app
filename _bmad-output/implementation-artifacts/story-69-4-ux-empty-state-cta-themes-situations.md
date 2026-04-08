# Story 69.4 : UX — Empty state avec CTA dans Thèmes et Situations

Status: done

## Story
En tant qu'admin, je veux que les pages Thèmes et Situations affichent un bouton "Créer" dans leur état vide (en plus du message existant), afin de ne pas être bloqué face à une page sans action possible.

## Acceptance Criteria
1. Dans `/methodologie/themes` — quand `themes.length === 0` (liste globalement vide) : afficher le texte "Aucun thème configuré." + un bouton gold "→ Créer un thème" qui navigue vers `/methodologie/themes/new`
2. Dans `/methodologie/situations` — quand `situations.length === 0` (liste globalement vide, sans filtre actif) : afficher le texte + un bouton inline "→ Créer la première situation" qui navigue vers `/methodologie/situations/new`
3. Style bouton : `backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8, marginTop: space.sm` — label `color: colors.text.dark, fontWeight: '700', fontSize: 13`
4. Le bouton est distinct du bouton header existant (celui-ci reste inchangé)

## Tasks
- [ ] T1 — Dans `themes/index.tsx` (ligne ~185-189), localiser le bloc `{!loading && !errorMsg && themes.length === 0 && (<AureakText>Aucun thème configuré.</AureakText>)}` — envelopper le texte + ajouter un `Pressable` bouton gold en dessous
- [ ] T2 — Dans `situations/index.tsx` (lignes ~164-168), localiser le bloc `{!loading && filtered.length === 0 && (<AureakText>Aucune situation configurée.</AureakText>)}` — distinguer les deux cas :
  - Si `situations.length === 0` (liste vide globalement) : afficher texte + bouton CTA
  - Si `situations.length > 0 && filtered.length === 0` (filtre actif sans résultat) : afficher seulement le message "Aucune situation pour la méthode X." (pas de CTA)
- [ ] T3 — Vérifier la navigation via `router.push` (déjà importé dans les deux fichiers)

## Dev Notes
Utiliser `useRouter` déjà importé. `Pressable` est déjà importé dans les deux fichiers.

Pattern bouton gold à utiliser :
```tsx
<Pressable
  onPress={() => router.push('/methodologie/themes/new' as never)}
  style={{ backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8, marginTop: space.sm, alignSelf: 'flex-start' }}
>
  <AureakText style={{ color: colors.text.dark, fontWeight: '700', fontSize: 13 } as never}>
    → Créer un thème
  </AureakText>
</Pressable>
```

Fichiers :
- `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` (modifier)
- `aureak/apps/web/app/(admin)/methodologie/situations/index.tsx` (modifier)

## Dev Agent Record
### Agent Model Used
### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | À modifier |
| `aureak/apps/web/app/(admin)/methodologie/situations/index.tsx` | À modifier |
