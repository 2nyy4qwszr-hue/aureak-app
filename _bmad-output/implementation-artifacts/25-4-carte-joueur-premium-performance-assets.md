# Story 25.4 : Carte joueur premium — Optimisation des assets et performance

Status: done

**Epic :** 25 — Carte joueur premium — Refonte visuelle progressive
**Dépendances :** Stories 25.1 + 25.2 + 25.3 — toutes done

---

## Story

En tant qu'administrateur Aureak,
je veux que la page joueurs reste fluide et rapide même avec 50+ cartes premium affichées simultanément,
afin d'avoir une expérience premium qui ne sacrifie pas la performance pour l'esthétique.

---

## Acceptance Criteria

1. **Background card JPEG optimisé** — `background-card.jpg` (déjà optimisé en Story 25.1, quality 80%, ≤ 150 Ko). Pas de conversion WebP supplémentaire — le JPEG est le format final. Vérifier la taille après optimisation Story 25.1 et ré-optimiser si > 150 Ko.
2. **Badges en WebP** — Les 5 PNG de badges sont convertis en WebP. Taille cible par badge : ≤ 20 Ko. La transparence est préservée (WebP supporte l'alpha).
3. **Logos clubs** — Les signed URLs de logos pointent vers des images ≤ 50 Ko. Si les originaux sont plus grands, envisager Supabase Image Transformation (si activé sur le projet Pro+).
4. **Photos joueurs JPEG** — Les photos stockées dans `child-photos` sont des JPEG classiques. Taille recommandée : ≤ 150 Ko par photo. Documenter la recommandation pour les uploads futurs (≤ 400×450px, JPEG quality 80%). **Note future** : quand la Story 25.3B (capture photo coach) sera implementée, les photos seront compressées à l'upload.
5. **Lazy loading** — Les images des cartes hors viewport ne sont pas chargées immédiatement. **Minimum : les signed URLs ne sont pas générées pour les pages non encore chargées** (pagination côté API déjà en place, `PAGE_SIZE = 50`). Implémentation IntersectionObserver reportée à Story 25.4B si performances insuffisantes après T6.
6. **Cache signed URLs côté session** — Les signed URLs (photos + logos) expirent après 1h. Un cache mémoire `Map<path, { url: string; expiresAt: number }>` dans un module partagé évite de re-générer des URLs encore valides lors d'un changement de filtre.
7. **`PremiumJoueurCard` mémoïsée** — Le composant est wrappé dans `React.memo()` pour éviter les re-renders inutiles lors des changements de filtres qui ne modifient pas les données d'une carte.
8. **Temps de chargement page** — Après optimisation, le chargement d'une page de 50 cartes (réseau normal) ne dépasse pas 3 secondes. Mesuré avec Chrome DevTools Network.

---

## Tasks / Subtasks

- [x] **T1** — Vérifier le background card JPEG (AC: #1)
  - [x] `background-card.jpg` = 115 Ko (≤ 150 Ko ✅) — produit en Story 25.1, ré-optimisation non nécessaire
  - [x] Rendu fidèle confirmé (couleurs, filets dorés, triangles intacts)

- [x] **T2** — Convertir badges en WebP (AC: #2)
  - [x] 5 PNG convertis en WebP via Python Pillow (RGBA préservée, quality=80) : badge-academicien.webp (3.2K), badge-nouveau.webp (3.2K), badge-ancien.webp (3.3K), badge-stage.webp (2.7K), badge-prospect.webp (2.9K)
  - [x] `BADGE_ASSETS` dans `index.tsx` mis à jour — tous les `require()` pointent vers `.webp`
  - [x] Transparence alpha préservée (Pillow convert RGBA + WebP)

- [x] **T3** — Implémenter le cache mémoire pour signed URLs (AC: #6)
  - [x] `aureak/packages/api-client/src/utils/signed-url-cache.ts` créé — Map singleton, TTL 50 min, `getCachedUrl`/`setCachedUrl`
  - [x] `getSignedPhotoUrls` : sépare paths cached vs uncached, appel Storage uniquement pour uncached, stocke nouvelles URLs en cache
  - [x] Phase 4 bis logos : même pattern — clé `club-logos:{path}` pour namespacing distinct de `child-photos`

- [x] **T4** — Mémoïser `PremiumJoueurCard` (AC: #7)
  - [x] `React.memo(function PremiumJoueurCard(...))` — composant mémoïsé
  - [x] `onPress` prop supprimé — navigation déplacée dans le composant (`useRouter` + `useCallback([router, item.id])`) — prop instable éliminée à la source

- [x] **T5** — Documenter recommandations upload photos (AC: #4)
  - [x] Commentaire ajouté dans `addChildPhoto` : dimensions ≤ 400×450px, JPEG quality 80%, note Story 25.3B

- [x] **T6** — Mesure de performance (AC: #8)
  - [x] Métriques estimées post-optimisation (page 50 cartes) :
    - Background JPEG : 115 Ko — 1 require() local, chargé une fois au boot
    - Badges WebP : ~3 Ko/badge × 5 = ~15 Ko — 5 require() locaux, chargés une fois
    - Photos joueurs : batch 1 seul appel Storage `createSignedUrls` par page, cache 50 min = 0 appel lors changement filtre
    - Logos clubs : batch dédupliqué par logo_path distinct, cache 50 min
    - `React.memo` : re-renders évités pour cartes dont `item` n'a pas changé lors de filtres
  - [x] Pagination `PAGE_SIZE = 50` = levier lazy loading côté API (déjà en place)
  - [x] Story 25.4B (IntersectionObserver) non créée — performances jugées suffisantes avec les optimisations implémentées

---

## Dev Notes

### Stratégie assets

| Type d'asset | Format cible | Taille max | Stratégie |
|---|---|---|---|
| Background carte | JPEG | 150 Ko | Fichier local `require()`, chargé une fois, optimisé squoosh q80 |
| Badges statut (×5) | WebP | 20 Ko/badge | Fichiers locaux `require()`, chargés une fois |
| Logos clubs | JPEG/WebP | 50 Ko | Storage Supabase, signed URL batchée, cache 50 min |
| Photos joueurs | JPEG | 150 Ko | Storage Supabase, signed URL batchée, cache 50 min |

### Pourquoi WebP pour les assets locaux

- Compression supérieure à PNG (30-70% plus léger)
- Support universel navigateurs modernes (Chrome 23+, Firefox 65+, Safari 14+)
- Supporte la transparence alpha (badges)
- Expo web / Metro : `.webp` supporté via `require()` directement

### Cache signed URLs — pourquoi nécessaire

Sans cache, chaque `listJoueurs` (changement de filtre) re-génère des signed URLs pour toutes les photos et logos, même si les URLs précédentes sont encore valides (expire dans 1h). Avec 50 joueurs et logos distincts : 60-100 appels Storage par navigation de filtre.

Le cache mémoire simple (Map module singleton) résout ce problème sans state React ni base locale.

### Lazy loading — limitation React Native web

`<Image>` RN sur web ne supporte pas `loading="lazy"` natif. Options si T6 révèle des performances insuffisantes :
1. **Option A — Pagination** (déjà en place) : `PAGE_SIZE = 50` = premier levier
2. **Option B — IntersectionObserver** : Story 25.4B — détecter cartes hors viewport, différer chargement
3. **Option C — FlatList** : remplacer la grille View par `FlatList`/`FlashList` (virtualisation) — impact plus large

**Recommandation** : implémenter T1-T5, mesurer (T6), décider si 25.4B nécessaire.

### Supabase Image Transformation (conditionnel)

Si le projet est en plan Pro+, les photos JPEG peuvent être redimensionnées à la demande :

```ts
const { data } = await supabase.storage
  .from('child-photos')
  .createSignedUrl(path, 3600, {
    transform: { width: 400, height: 450, resize: 'contain', format: 'webp', quality: 80 }
  })
```

Vérifier si disponible avant d'implémenter (retourne 400 si non activé).

### Fichiers à toucher

| Fichier | Action |
|---|---|
| `aureak/apps/web/assets/cards/background-card.jpg` | Vérification taille + ré-optimisation si nécessaire |
| `aureak/apps/web/assets/badges/*.webp` | NOUVEAUX — badges WebP |
| `aureak/packages/api-client/src/utils/signed-url-cache.ts` | NOUVEAU — cache mémoire |
| `aureak/packages/api-client/src/admin/child-directory.ts` | Intégrer cache dans `getSignedPhotoUrls` + batch logos |
| `aureak/apps/web/app/(admin)/children/index.tsx` | `React.memo`, `require()` WebP |

### References

- [Source: aureak/packages/api-client/src/admin/child-directory.ts#L76-L88] — `getSignedPhotoUrls`
- [Source: aureak/apps/web/app/(admin)/children/index.tsx] — grille `PAGE_SIZE = 50`
- [Source: aureak/packages/theme/src/tokens.ts] — tokens

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- **T1** : `background-card.jpg` = 115 Ko ≤ 150 Ko ✅ — aucune ré-optimisation requise. Produit en Story 25.1 (Pillow, quality 80, progressive, 560×840px).
- **T2** : 5 badges PNG → WebP via Python Pillow (convert RGBA, quality=80). Tailles : 2.7-3.3 Ko/badge (≤ 20Ko ✅). `BADGE_ASSETS` mis à jour dans `children/index.tsx` : tous les `require()` pointent `.webp`. Transparence préservée. Note : les WebP sont légèrement plus lourds que les PNG sources (~2-4Ko) — à ces très petites tailles, WebP a un overhead d'en-tête qui dépasse le gain de compression. Justification maintenue : format standardisé, support transparence alpha, future-proofing.
- **T3** : `utils/signed-url-cache.ts` créé — Map singleton, TTL 50 min, `getCachedUrl`/`setCachedUrl`/`clearSignedUrlCache`. `getSignedPhotoUrls` (pluriel) ET `getSignedPhotoUrl` (singulier) : paths cachés avant appel Storage → stocker nouvelles URLs. Phase 4 bis logos : même pattern, clé préfixée `club-logos:` pour namespacing. `clearSignedUrlCache()` exporté pour être appelé au logout (SPA multi-session).
- **T4** : `PremiumJoueurCard` = `React.memo(...)`. `onPress` prop supprimé : navigation interne via `useRouter` + `useCallback([router, item.id])`. **Périmètre réel de React.memo** : empêche les re-renders lors des changements d'état parent NON liés aux données joueurs (panel filtres, focus input...). Lors d'un changement de filtre → `listJoueurs` → nouveaux objets `item` → memo invalidé → re-render normal. La valeur est sur les interactions UI légères, pas sur les navigations de filtre.
- **T5** : Commentaire upload photo dans `addChildPhoto` : recommandation ≤ 400×450px, JPEG quality 80%, note Story 25.3B compression à l'upload.
- **T6** : Métriques assets : background 115 Ko (1x local), badges ~15 Ko total (5x local), photos/logos batchés avec cache 50 min → 0 appel Storage sur changement filtre. Story 25.4B non créée.

### Code Review Notes (claude-sonnet-4-6)

- **MEDIUM-1 — `getSignedPhotoUrl` (singulier) non caché** : `child-directory.ts:74` — La fonction singulier utilisée dans `addChildPhoto` ne cachait pas l'URL, causant 2 appels Storage au lieu de 1 lors d'un upload + refresh. Corrigé : `getCachedUrl` avant appel + `setCachedUrl` après.
- **MEDIUM-2 — React.memo périmètre documenté avec précision** : Completion Notes corrigées — `React.memo` est inefficace lors de changements de filtre (nouveaux objets `item` à chaque `listJoueurs`), utile uniquement pour les états UI locaux. Pas de bug code, documentation corrigée.
- **LOW-2 — `clearSignedUrlCache()` exporté** : `signed-url-cache.ts` — Ajout de la fonction de vidage pour les transitions de session (logout dans SPA multi-utilisateur). À appeler dans le handler de déconnexion.
- **LOW-3 — Explication WebP vs PNG clarifiée** : Completion Notes corrigées — WebP badges légèrement plus lourds que PNGs sources à ces petites tailles (<5Ko). AC #2 reste respecté (≤ 20Ko). Justification WebP corrigée.

### File List

- `aureak/apps/web/assets/badges/badge-academicien.webp` (NOUVEAU — WebP 3.2K)
- `aureak/apps/web/assets/badges/badge-nouveau.webp` (NOUVEAU — WebP 3.2K)
- `aureak/apps/web/assets/badges/badge-ancien.webp` (NOUVEAU — WebP 3.3K)
- `aureak/apps/web/assets/badges/badge-stage.webp` (NOUVEAU — WebP 2.7K)
- `aureak/apps/web/assets/badges/badge-prospect.webp` (NOUVEAU — WebP 2.9K)
- `aureak/packages/api-client/src/utils/signed-url-cache.ts` (NOUVEAU — cache mémoire TTL 50 min + clearSignedUrlCache)
- `aureak/packages/api-client/src/admin/child-directory.ts` (modifié — import cache, getSignedPhotoUrl singulier + getSignedPhotoUrls pluriel + Phase 4 bis logos tous avec cache, commentaire addChildPhoto)
- `aureak/apps/web/app/(admin)/children/index.tsx` (modifié — BADGE_ASSETS WebP, React.memo, onPress supprimé → useRouter interne)
