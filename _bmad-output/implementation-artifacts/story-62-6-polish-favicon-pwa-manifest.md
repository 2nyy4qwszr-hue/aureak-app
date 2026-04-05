# Story 62.6 : Polish — Favicon + PWA manifest Aureak

Status: done

## Story

En tant qu'utilisateur accédant à l'app Aureak depuis un navigateur,
Je veux voir le favicon Aureak dans l'onglet du navigateur et un manifest PWA complet,
Afin que l'app soit reconnaissable et installable avec les bonnes métadonnées (nom, couleurs, icônes).

## Acceptance Criteria

**AC1 — Favicon SVG ballon or dans l'onglet**
- **Given** l'utilisateur ouvre l'app dans un navigateur
- **When** l'onglet s'affiche
- **Then** le favicon est un SVG représentant un ballon de football stylisé (hexagone or `#C9A84C` sur fond noir)

**AC2 — Plusieurs tailles de favicon**
- **And** les fichiers suivants sont présents dans `aureak/apps/web/public/` :
  - `favicon.svg` (vecteur principal)
  - `favicon-32x32.png` (fallback navigateurs)
  - `favicon-16x16.png`
  - `apple-touch-icon.png` (180×180, pour iOS)

**AC3 — Manifest PWA complet**
- **And** un fichier `manifest.json` est présent dans `aureak/apps/web/public/` avec :
  - `name: "Aureak Academy"`
  - `short_name: "Aureak"`
  - `description: "Plateforme de gestion d'académie de gardiens de but"`
  - `theme_color: "#C9A84C"` (or Aureak)
  - `background_color: "#0F0F0F"` (noir splash)
  - `display: "standalone"`
  - `start_url: "/"`
  - `icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512" }]`

**AC4 — Icônes d'installation PWA**
- **And** `icon-192.png` et `icon-512.png` sont présents dans `public/` — logo "A" Aureak stylisé sur fond or
- **And** `icon-512.png` est une version maskable (safe zone centrale pour les stores Android)

**AC5 — Balises `<head>` dans le layout**
- **And** les balises suivantes sont présentes dans le `<head>` de l'app :
  - `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`
  - `<link rel="icon" href="/favicon-32x32.png" sizes="32x32">`
  - `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
  - `<link rel="manifest" href="/manifest.json">`
  - `<meta name="theme-color" content="#C9A84C">`

**AC6 — Screenshots pour install prompt**
- **And** deux screenshots sont présents dans `public/screenshots/` :
  - `screenshot-desktop.png` (1280×800) — capture du dashboard
  - `screenshot-mobile.png` (390×844) — capture de la vue séance mobile
- **And** ils sont référencés dans `manifest.json` sous la clé `screenshots`

**AC7 — Validation lighthouse PWA**
- **And** un audit Lighthouse PWA du projet donne un score ≥ 80 sur les critères "Installable" et "PWA Optimized" (à documenter dans un commentaire du fichier manifest)

## Tasks / Subtasks

- [ ] Task 1 — Créer `favicon.svg` (AC: #1)
  - [ ] 1.1 SVG 32×32 : hexagone or `#C9A84C` centré sur fond noir `#0F0F0F`, lignes de ballon stylisées
  - [ ] 1.2 Sauvegarder dans `aureak/apps/web/public/favicon.svg`

- [ ] Task 2 — Créer les PNG (AC: #2, #4)
  - [ ] 2.1 Créer `favicon-32x32.png` et `favicon-16x16.png` depuis le SVG (via outil en ligne ou script canvas)
  - [ ] 2.2 Créer `apple-touch-icon.png` (180×180) : logo "A" blanc sur fond or `#C9A84C`
  - [ ] 2.3 Créer `icon-192.png` et `icon-512.png` : logo Aureak avec safe zone 80% (maskable)

- [ ] Task 3 — Créer `manifest.json` (AC: #3, #4, #6)
  - [ ] 3.1 Créer `aureak/apps/web/public/manifest.json` avec tous les champs requis
  - [ ] 3.2 Inclure les références icons (192 + 512) et screenshots
  - [ ] 3.3 Ajouter `"purpose": "any maskable"` sur les icônes 512px

- [ ] Task 4 — Créer les screenshots PWA (AC: #6)
  - [ ] 4.1 Créer `public/screenshots/` avec des captures d'écran réelles ou représentatives
  - [ ] 4.2 Dimensions : 1280×800 (desktop) et 390×844 (mobile)

- [ ] Task 5 — Ajouter balises `<head>` dans le layout (AC: #5)
  - [ ] 5.1 Identifier le fichier HTML root ou le layout Expo Router qui gère le `<head>`
  - [ ] 5.2 Ajouter les `<link>` et `<meta>` requis via `expo-router/head` ou fichier `app/_layout.tsx` web

- [ ] Task 6 — QA scan
  - [ ] 6.1 Vérifier que `manifest.json` est valide JSON (pas d'erreurs de syntaxe)
  - [ ] 6.2 Vérifier que les chemins des icônes sont corrects (relatifs à `public/`)
  - [ ] 6.3 Documenter le score Lighthouse attendu dans un commentaire

## Dev Notes

### favicon.svg minimal

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#0F0F0F" rx="6"/>
  <!-- Hexagone ballon stylisé -->
  <polygon points="16,4 27,10 27,22 16,28 5,22 5,10"
           fill="none" stroke="#C9A84C" stroke-width="2"/>
  <!-- Lettre A centrale -->
  <text x="16" y="21" text-anchor="middle"
        font-family="Montserrat,sans-serif" font-weight="900"
        font-size="14" fill="#C9A84C">A</text>
</svg>
```

### manifest.json complet

```json
{
  "name"            : "Aureak Academy",
  "short_name"      : "Aureak",
  "description"     : "Plateforme de gestion d'académie de gardiens de but",
  "theme_color"     : "#C9A84C",
  "background_color": "#0F0F0F",
  "display"         : "standalone",
  "start_url"       : "/",
  "orientation"     : "portrait-primary",
  "lang"            : "fr",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/screenshot-desktop.png", "sizes": "1280x800",  "type": "image/png", "form_factor": "wide" },
    { "src": "/screenshots/screenshot-mobile.png",  "sizes": "390x844",   "type": "image/png", "form_factor": "narrow" }
  ]
}
```

### Balises head via Expo Router

```typescript
// Dans apps/web/app/(admin)/_layout.tsx ou app/_layout.tsx
import { Head } from 'expo-router/head'  // si disponible
// ou dans apps/web/index.html pour expo-router web
```

### Constante GOLD_HEX locale dans favicon.svg
- `#C9A84C` = gold Aureak pour les assets statiques (SVG/PNG), différent de `colors.accent.gold` (token runtime)

## File List

- `aureak/apps/web/public/favicon.svg` — créer
- `aureak/apps/web/public/favicon-32x32.png` — créer
- `aureak/apps/web/public/favicon-16x16.png` — créer
- `aureak/apps/web/public/apple-touch-icon.png` — créer
- `aureak/apps/web/public/icon-192.png` — créer
- `aureak/apps/web/public/icon-512.png` — créer
- `aureak/apps/web/public/manifest.json` — créer
- `aureak/apps/web/public/screenshots/screenshot-desktop.png` — créer (placeholder)
- `aureak/apps/web/public/screenshots/screenshot-mobile.png` — créer (placeholder)
- `aureak/apps/web/app/(admin)/_layout.tsx` — modifier (balises head)
