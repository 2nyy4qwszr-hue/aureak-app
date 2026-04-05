# Story 58-5 — Méthodologie : QR code exercice

**Epic** : 58 — Méthodologie "Tactical Notebook"
**Status** : done
**Priority** : low
**Effort** : S (quelques heures)

---

## Contexte

Les coaches travaillent sur le terrain avec une tablette. Cette story génère un QR code pour chaque situation pédagogique dans sa fiche détail, permettant au coach d'afficher le QR sur sa tablette et aux joueurs / assistants de scanner pour accéder à la fiche depuis leur téléphone.

---

## User Story

**En tant que** coach Aureak,
**je veux** générer un QR code pour chaque exercice et l'afficher sur ma tablette,
**afin de** partager rapidement la fiche d'exercice avec mes assistants sur le terrain sans connexion préalable.

---

## Acceptance Criteria

- [x] AC1 — La fiche détail d'une situation (`methodologie/situations/[situationKey]/page.tsx`) affiche un bouton "QR code" dans la barre d'actions en haut de page
- [x] AC2 — Le clic sur "QR code" génère et affiche un QR code encodant l'URL de la fiche : `https://app.aureak.be/methodologie/situations/{situationKey}` (ou `window.location.href` en fallback)
- [x] AC3 — La génération du QR code utilise la librairie **`qrcode`** (npm) via `QRCode.toDataURL(url)` qui retourne un `data:image/png;base64,...` — affiché dans un `<Image>` React Native (`source={{ uri: dataUrl }}`)
- [x] AC4 — Le QR code s'affiche dans une **modal** centrée avec : QR 200×200px, titre "Scanner pour ouvrir l'exercice", URL texte cliquable sous le QR, bouton "Fermer" et bouton "Imprimer" (`window.print()` web only)
- [x] AC5 — La génération est synchrone (pas d'appel réseau) — `qrcode` est une librairie pure JS ; si elle n'est pas installée, l'ajouter dans `aureak/apps/web/package.json`
- [x] AC6 — Un état `generatingQR: boolean` est géré avec `try/finally` pendant la génération (bien que rapide, le `try/finally` est obligatoire selon les règles du projet)
- [x] AC7 — La modal est stylée en light premium : fond `colors.light.surface`, `borderRadius: radius.cardLg`, `boxShadow: shadows.lg`, backdrop semi-transparent
- [x] AC8 — L'URL encodée dans le QR est loggée en `console.log` uniquement en développement (`NODE_ENV !== 'production'`) pour faciliter le debug
- [x] AC9 — La feature est **web only** — sur mobile natif, le bouton est masqué (détecter via `Platform.OS !== 'web'` de `react-native`)
- [x] AC10 — Zéro hardcode — tokens `@aureak/theme` ; domaine configurable via `process.env.EXPO_PUBLIC_APP_URL ?? 'https://app.aureak.be'`

---

## Tasks

### T1 — Installation `qrcode`

```bash
cd aureak/apps/web && npm install qrcode
cd aureak/apps/web && npm install --save-dev @types/qrcode
```

- [x] `qrcode` ajouté dans `package.json` web

### T2 — Utilitaire `generateQRCode`

Fichier : `aureak/apps/web/app/(admin)/methodologie/_components/qr-utils.ts` (nouveau)

- [x] Utilitaire créé

### T3 — Bouton + modal dans `situations/[situationKey]/page.tsx`

- [x] Bouton QR ajouté (web only)
- [x] Modal QR stylée et fonctionnelle
- [x] try/finally sur `setGeneratingQR`

---

## Dépendances

- Epic 20 `done` — `situations/[situationKey]/page.tsx` existant

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/package.json` | Modifier — `qrcode` |
| `aureak/apps/web/app/(admin)/methodologie/_components/qr-utils.ts` | Créer |
| `aureak/apps/web/app/(admin)/methodologie/situations/[situationKey]/page.tsx` | Modifier — bouton + modal QR |

---

## QA post-story

```bash
grep -n "setGeneratingQR" aureak/apps/web/app/(admin)/methodologie/situations/\[situationKey\]/page.tsx
grep -n "console\." aureak/apps/web/app/(admin)/methodologie/situations/\[situationKey\]/page.tsx | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-58): story 58-5 — méthodologie QR code exercice terrain (tablette-friendly)
```
