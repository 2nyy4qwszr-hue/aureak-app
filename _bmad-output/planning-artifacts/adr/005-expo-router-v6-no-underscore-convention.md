# ADR 005 — Expo Router v6 : pas de convention `_` pour exclure les non-routes

**Statut** : Accepté (2026-04-21)
**Story source** : 95.1 — Cleanup routing Expo Router
**Auteur** : Équipe Dev Aureak

## Contexte

Contrairement à Expo Router v3/v4 et à Next.js, **Expo Router v6 n'a PAS de convention d'exclusion automatique pour les fichiers/dossiers préfixés `_`**. La regex baked-in dans `node_modules/expo-router/_ctx-shared.js` :

```js
/^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+(html|native-intent))))\.[tj]sx?$).*\.[tj]sx?$/
```

Seuls `+api.ts`, `+html.tsx`, `+native-intent.tsx` sont exclus du scan. **Tous les autres `.ts`/`.tsx` sous `apps/web/app/` sont traités comme routes potentielles**, et les fichiers sans `export default` déclenchent :

```
Route "./(admin)/_components/foo.ts" is missing the required default export.
```

`_layout.tsx` est détecté par filename exact (pas exclusion).

## Décision

**Déplacer tous les non-routes hors de `app/`** plutôt que patcher `expo-router` via `patch-package`.

### Structure cible

```
aureak/apps/web/
├── app/                          ← UNIQUEMENT des routes (page.tsx, _layout.tsx, index.tsx)
├── components/admin/<domain>/    ← composants UI admin (.tsx sans default export)
├── lib/admin/<domain>/           ← utils admin (.ts)
├── hooks/admin/                  ← hooks React admin-only
├── contexts/admin/               ← Contexts React admin-only
```

### Pourquoi pas `patch-package`

1. **Dette technique invisible** : le prochain dev tombe dans le même piège sans indice clair
2. **Fragilité** : patch casse au prochain bump mineur d'`expo-router`, warnings reviennent en silence
3. **Équipe distribuée** : un dev upgrade, le patch saute, confusion diffuse
4. **Symptôme vs cause** : avoir des non-routes dans `app/` reste une mauvaise pratique architecturale indépendamment du warning

Déplacer est plus de travail **une fois** mais élimine la dette définitivement.

## Conséquences

### Positives

- Zéro warning `missing required default export` dans la console dev
- Séparation claire "logique routing" (`app/`) vs "composants/utils" (hors `app/`)
- Compatible avec les conventions upstream Expo / Next.js
- Upgrade `expo-router` safe (aucun patch à maintenir)

### Négatives

- Chemins d'import plus longs pour certains consommateurs (ex: `'../../../../components/admin/<domain>/Foo'`)
- Importer un Context exporté depuis un `_layout.tsx` depuis hors de `app/` produit un chemin ugly (`'../../../app/(admin)/<domain>/_layout'`). Option future : extraire les Contexts dans des fichiers dédiés (story distincte).

## Règle pour les futures stories

> **Pas de fichiers non-routes dans `app/`** : tout composant/util/hook/context qui n'a pas de `export default` doit vivre sous `aureak/apps/web/components/`, `lib/`, `hooks/`, ou `contexts/`. Expo Router v6 scanne tout `app/` et warning sur les fichiers sans default export.

Exceptions acceptées dans `app/` :
- `page.tsx` (route principale)
- `index.tsx` (re-export de `./page`)
- `_layout.tsx` (layout Expo Router)
- `+api.ts`, `+html.tsx`, `+native-intent.tsx` (special routes)

## Références

- Story 95.1 — Cleanup routing Expo Router v6
- `node_modules/expo-router/_ctx-shared.js` — regex d'exclusion baked-in
- `node_modules/expo-router/build/matchers.js:91` — `isLayoutFile` detection
- `node_modules/expo-router/build/getRoutesCore.js:311` — warning emitter
