# Aureak — Design System (Homepage reference)

Fichier de référence à importer dans un autre projet pour garder une cohérence visuelle totale avec la homepage du site Aureak. Stack source : **Next.js 15 + Tailwind v4 + Framer Motion**.

---

## 1. Identité & positionnement

- **Ton visuel :** éditorial premium, sportif haut de gamme, sérieux mais chaleureux. Fond blanc dominant, or mat comme seul accent. Aucun gradient criard, aucun emoji.
- **Anti-patterns :** neon, glow bleus, tech-bro dashboards, gradients multicolores, coins 90° brutalistes, illustrations 3D génériques.
- **Références proches :** Linear (rigueur typographique), Apple éditorial (blancs généreux), Awwwards "agency sobres" (or + noir).

---

## 2. Palette

| Rôle               | Hex       | Usage                                                      |
| ------------------ | --------- | ---------------------------------------------------------- |
| **Gold (accent)**  | `#C1AC5C` | Mots clés, bordures actives, underlines, stats, highlights |
| **Gold soft fill** | `rgba(193,172,92,0.07)` | Fond des pills, halos subtils                    |
| **Gold border**    | `rgba(193,172,92,0.3)`  | Bordure pills / badges                           |
| **Gold halo**      | `rgba(193,172,92,0.06)` | Lumière ambiante radiale (hero)                  |
| **Ink primary**    | `#111111` | Boutons primaires, titres très contrastés                  |
| **Text base**      | `zinc-900` (`#18181b`) | Titres H1-H3                                      |
| **Text body**      | `zinc-500` / `zinc-600` | Paragraphes                                      |
| **Text muted**     | `zinc-400` | Labels stats, métadonnées                                 |
| **Hairlines**      | `zinc-200` (`#e4e4e7`) | Séparateurs 1px, dividers verticaux              |
| **Surface warm**   | `#F3EFE7` | Blocs alternés chauds (sections secondaires)              |
| **Background**     | `#FFFFFF` | Fond global                                                |
| **Selection**      | `rgba(193,172,92,0.25)` | Sélection texte                                  |

**Règle d'or :** **un seul accent** (or). Jamais deux couleurs vives sur la même vue. Le contraste vient du noir `#111`/blanc, pas de la couleur.

---

## 3. Typographie

### Familles (Google Fonts via `next/font`)

```ts
import { Geist, Geist_Mono, Montserrat, Poppins } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700","800","900"], variable: "--font-montserrat", display: "swap" });
const poppins    = Poppins({    subsets: ["latin"], weight: ["400","500","600"], variable: "--font-poppins",    display: "swap" });
```

| Rôle                 | Famille     | Poids    | Usage                                |
| -------------------- | ----------- | -------- | ------------------------------------ |
| **Display / H1-H2**  | Montserrat  | 900      | Titres percutants, mots forts, stats |
| **UI / body / CTA**  | Poppins     | 400-600  | Paragraphes, boutons, labels, badges |
| **Sans neutre**      | Geist Sans  | variable | Fallback global `body`               |
| **Mono**             | Geist Mono  | variable | Rare — code, numéros techniques      |

### Échelle

```css
/* H1 hero — fluide */
font-size: clamp(1.15rem, 3.5vw + 0.4rem, 3.2rem);
font-weight: 900;
letter-spacing: -0.01em;
line-height: 1.1;

/* H2 section */
font-size: clamp(1.8rem, 4vw, 3rem);
font-weight: 900;
text-transform: uppercase; /* pour les mots-clés scroll */

/* Body */
font-size: clamp(0.9rem, 1.1vw, 1.05rem);
line-height: 1.75;
color: zinc-500;

/* Label / badge */
font-size: 0.7rem;
letter-spacing: 0.08em;
font-weight: 600;
text-transform: uppercase;
```

### Règles typo

- **Titres Montserrat** toujours en `font-black` (900), jamais plus léger.
- **Body Poppins** `font-weight: 400`, `line-height: 1.75` pour lisibilité premium.
- **Highlights** dans un titre → même Montserrat, couleur `#C1AC5C` (pas d'italique, pas de soulignement).
- **Tracking serré** sur gros titres (`-0.01em`), **tracking étendu** sur petits labels (`0.08em`-`0.2em`).

---

## 4. Spacing & layout

### Sections

- **Verticale :** `py-24` minimum, `py-32` ou `py-40` pour sections premium. Jamais moins de `py-20` sur desktop.
- **Horizontale :** `px-6` mobile → `md:px-12` → `lg:px-16` → `xl:px-24`.
- **Max width :** `max-w-6xl` ou `max-w-7xl` centré. Paragraphes : `max-w-[50ch]` (mesure de lecture optimale).

### Grid hero

```tsx
<div className="grid min-h-[calc(100dvh-4.5rem)] grid-cols-1 items-stretch md:grid-cols-2">
  {/* gauche : texte, order-2 mobile / order-1 desktop */}
  {/* droite : média, order-1 mobile / order-2 desktop */}
</div>
```

### Hauteurs

- Toujours `min-h-[100dvh]` (jamais `h-screen` — mobile Safari corrompt `vh`).
- Hero : section scroll-driven avec `height: 150vh` + `sticky top-0` à l'intérieur.

---

## 5. Composants clés

### Pill / badge localisation

```tsx
<span
  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-semibold tracking-[0.08em]"
  style={{
    fontFamily: "var(--font-poppins)",
    color: "#C1AC5C",
    border: "1px solid rgba(193,172,92,0.3)",
    backgroundColor: "rgba(193,172,92,0.07)",
  }}
>
  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#C1AC5C" }} />
  Académie · Belgique
</span>
```

### CTA primary (noir, pill, flèche dans cercle)

```tsx
<a
  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold md:gap-3 md:px-7"
  style={{
    fontFamily: "var(--font-poppins)",
    backgroundColor: "#111111",
    color: "#ffffff",
    boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
  }}
>
  Trouver le programme
  <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
        style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
    →
  </span>
</a>
```

**Hover :** `whileHover={{ scale: 1.03 }}`, **tap :** `whileTap={{ scale: 0.97 }}`.

### CTA secondary (ghost, border gris)

```tsx
style={{ backgroundColor: "transparent", color: "#3f3f46", border: "1.5px solid #d4d4d8" }}
```

### Divider gold (accent minimal)

```tsx
<div className="mb-7 h-px w-20" style={{ backgroundColor: "#C1AC5C" }} />
```
Entrée animée : `initial={{ scaleX: 0, originX: 0 }}` → `animate={{ scaleX: 1 }}`, durée 0.7s ease out.

### Stats inline (avec dividers verticaux)

```tsx
<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
  {stats.map((s, i) => (
    <div key={i} className="flex items-center gap-1.5">
      <span className="text-[0.95rem] font-black" style={{ fontFamily: "var(--font-montserrat)", color: "#C1AC5C" }}>
        {s.value}
      </span>
      <span className="text-[0.72rem] text-zinc-400" style={{ fontFamily: "var(--font-poppins)" }}>
        {s.label}
      </span>
      {i < stats.length - 1 && <span className="ml-2 h-3 w-px bg-zinc-200" aria-hidden />}
    </div>
  ))}
</div>
```

### Grain overlay (texture film subtile, globale)

```tsx
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

<div
  aria-hidden
  className="pointer-events-none fixed inset-0 z-50 opacity-[0.022]"
  style={{ backgroundImage: GRAIN_SVG, backgroundRepeat: "repeat", backgroundSize: "300px 300px" }}
/>
```

**Règle :** grain toujours `position: fixed` + `pointer-events: none`. Opacity `0.02-0.025` — imperceptible mais présent.

### Lumière ambiante dorée (hero background)

```tsx
<div
  aria-hidden
  className="pointer-events-none absolute inset-0"
  style={{ background: "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(193,172,92,0.06) 0%, transparent 70%)" }}
/>
```

---

## 6. Animation & motion

### Librairie

**Framer Motion** — toutes les interactions. Pas de GSAP sur les pages standard (réservé au scroll-driven video).

### Easings signature

```ts
const easeOut = [0.16, 1, 0.3, 1]; // cubic-bezier premium
```

Toutes les entrées utilisent ce ease. **Jamais** `linear`, rarement `ease-in-out` classique.

### Durées

- **Micro-interactions** (hover, tap) : 150-200ms
- **Entrées de texte / fade-in** : 600-800ms
- **Transitions de section** : 700ms
- **Stagger entre éléments** : 50-80ms de delay incrémental

### Patterns d'entrée standard

```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={inView ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
/>
```

### Scroll-driven (hero)

```tsx
const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
const opacity = useTransform(smooth, [0, 0.5, 0.85], [1, 0.82, 0.55]);
const y = useTransform(smooth, [0, 1], [0, -60]);
```

**Règle absolue :** n'animer que `transform` et `opacity`. **Jamais** `width`, `height`, `top`, `left`, `margin`.

### `useInView` pour déclenchement progressif

```tsx
const textInView = useInView(textRef, { once: true, margin: "-80px" });
```

---

## 7. Fond & surface

- **Background global :** `#FFFFFF`. Pas de off-white par défaut.
- **Sections alternées :** soit blanc pur, soit `#F3EFE7` (warm cream) pour respiration. Éviter gris froid.
- **Dark sections :** `#0A0A0A` ou `#111111` avec or comme unique accent (hero scroll-driven, CTA final).
- **Borders :** `1px solid #e4e4e7` (zinc-200) — jamais plus épais pour les hairlines.

---

## 8. Accessibilité & responsive

- Tous les CTA : `focus-visible:ring-2 focus-visible:ring-[#C1AC5C]/60 focus-visible:ring-offset-2`.
- `aria-hidden="true"` sur tous les éléments décoratifs (grain, halos, SVG ornements).
- Mobile `< 768px` → **single column** systématique. Ordres inversés avec `order-1 md:order-2`.
- Touch targets ≥ 44px de hauteur (CTA : `py-3.5` minimum).
- `min-h-[100dvh]` — jamais `h-screen`.

---

## 9. Checklist "Aureak-like" pour un nouveau composant

Avant de valider un écran, vérifier :

- [ ] **Un seul accent couleur** : `#C1AC5C` et rien d'autre (pas de bleu/vert/rouge hors erreur).
- [ ] **Titres en Montserrat 900** avec 1-2 mots highlight en gold.
- [ ] **Body en Poppins 400** sur `zinc-500`, `line-height: 1.75`, `max-w-[50ch]`.
- [ ] **CTA primary noir pill** avec flèche dans cercle translucide.
- [ ] **Hairline gold `h-px w-20`** entre titre et paragraphe.
- [ ] **Padding section ≥ `py-24`**.
- [ ] **Grain overlay global** actif (opacity 0.022).
- [ ] **Ease `[0.16, 1, 0.3, 1]`** sur toutes les entrées.
- [ ] **Stats Montserrat black + label Poppins muted** avec dividers verticaux `1px`.
- [ ] Aucun emoji, aucun buzzword ("Seamless", "Empower", etc.), aucun placeholder.

---

## 10. Installation dans un nouveau projet

### Dépendances

```bash
npm install framer-motion
npm install next/font  # inclus dans Next.js 13+
```

### `app/layout.tsx`

```tsx
import { Montserrat, Poppins, Geist, Geist_Mono } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700","800","900"], variable: "--font-montserrat", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-poppins", display: "swap" });
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

// Appliquer les variables sur <body>
<body className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${poppins.variable} antialiased`}>
```

### `app/globals.css`

```css
@import "tailwindcss";

:root { --background: #ffffff; --foreground: #171717; }
html { scroll-behavior: smooth; }
body { background: var(--background); color: var(--foreground); font-family: var(--font-geist-sans), system-ui, sans-serif; }
::selection { background-color: rgba(193, 172, 92, 0.25); color: inherit; }
```

### Tokens Tailwind (optionnel, extension du thème)

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: "#C1AC5C", soft: "rgba(193,172,92,0.07)", border: "rgba(193,172,92,0.3)" },
        ink: "#111111",
        cream: "#F3EFE7",
      },
      fontFamily: {
        display: ["var(--font-montserrat)"],
        ui: ["var(--font-poppins)"],
      },
    },
  },
};
```

---

## 11. Comment utiliser ce fichier dans un autre projet Claude

1. **Copier ce fichier** dans `docs/design-reference.md` ou `.claude/DESIGN.md` du projet cible.
2. Dans le `CLAUDE.md` du projet cible, ajouter une ligne :

```md
## Design reference
Suivre strictement `docs/design-reference.md` — palette, typo, spacing, motion. Aucune déviation sans validation.
```

3. À chaque prompt de création d'UI, **référencer explicitement** le fichier :
   > "Crée la page Contact en suivant strictement `docs/design-reference.md`. Ne pas dévier de la palette or/noir/blanc ni des patterns de motion."

4. Pour Claude Code, le fichier sera lu automatiquement si placé dans `.claude/` ou référencé dans `CLAUDE.md`.

---

**Source :** composants `app/page.tsx` + `components/home/*` du projet Site Aureak.
**Date de snapshot :** 2026-04-10.
