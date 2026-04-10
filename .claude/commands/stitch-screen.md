---
name: 'stitch-screen'
description: 'Génère automatiquement des maquettes Stitch pour une story UI Aureak. Détecte les écrans, applique le design system, stocke les références dans la story. Entièrement automatique — aucune confirmation requise.'
---

# Stitch Screen Generator — Aureak

Génère des maquettes Stitch pour visualiser les écrans **avant** implémentation. Entièrement silencieux — une seule ligne de sortie.

---

## Entrée

Argument optionnel : chemin vers un fichier story `_bmad-output/implementation-artifacts/*.md`

Si aucun argument → chercher la story `in-progress` dans `_qa/gates/day-queue.md`

---

## ÉTAPE 1 — Détecter si la story est UI

Lire le fichier story. Chercher dans `## Tasks` et `## Acceptance Criteria` la présence d'au moins UN de ces mots-clés :

```
tsx, page.tsx, component, écran, screen, formulaire, form, modal, carte, card,
layout, design, affichage, liste, tableau, sidebar, navigation, bouton, button,
dashboard, UI, interface, render, view, style
```

**Si aucun mot-clé trouvé** → afficher rien, terminer immédiatement. (Skip silencieux)

**Si détection positive** → continuer.

---

## ÉTAPE 2 — Extraire les informations de la story

Depuis la story, extraire :

1. **Titre** — ligne `# Story X.Y: {titre}`
2. **Écrans à créer** — chercher dans les tasks des chemins comme `app/(admin)/...page.tsx` ou `app/(admin)/...index.tsx`. Chaque fichier `.tsx` unique = 1 écran potentiel.
3. **ACs visuels** — les ACs qui contiennent "affiche", "page", "écran", "composant", "design", "liste", "formulaire", "modal"
4. **Rôle cible** — admin, parent, coach, child, club (déduit du chemin ou du titre)

---

## ÉTAPE 3 — Obtenir le projet Stitch Aureak

```
mcp__stitch__list_projects
```

Chercher un projet dont le nom contient "Aureak".

- **Trouvé** → utiliser cet `id` de projet
- **Non trouvé** → créer :
  ```
  mcp__stitch__create_project
  name: "Aureak Platform"
  description: "Plateforme de gestion d'académie football (gardiens de but). Admin web + portails coach/parent/enfant/club. Design Light Premium."
  ```

---

## ÉTAPE 4 — Vérifier / créer le design system

```
mcp__stitch__list_design_systems
```

Chercher "Aureak" dans la liste.

**Si non trouvé** → créer :

```
mcp__stitch__create_design_system
name: "Aureak Design System v2"
description: "Light Premium DA — Fond principal beige #F3EFE7, cards blanches #FFFFFF avec ombre légère, sidebar dark #1A1A1A, accent gold #C9A84C, texte principal #1A1A1A, texte secondaire #6B7280, bordures #E5E0D8, bordure gold #C9A84C, police Montserrat, rayon de bord 12px cards / 8px inputs, ombres douces sm. Anti-patterns : jamais de couleurs hardcodées en dehors des tokens, jamais de rouge agressif (utiliser #E05252 seulement pour erreurs critiques)."
```

Appliquer au projet :

```
mcp__stitch__apply_design_system
project_id: {project_id}
design_system_id: {design_system_id}
```

---

## ÉTAPE 5 — Générer les écrans

Pour chaque écran identifié à l'étape 2 (maximum 3 écrans par story) :

```
mcp__stitch__generate_screen_from_text
project_id: {project_id}
prompt: "{prompt détaillé ci-dessous}"
```

### Construire le prompt pour chaque écran

Template de prompt :

```
Application web admin "Aureak" — plateforme de gestion d'académie de football (gardiens de but).

CONTEXTE VISUEL :
- Design Light Premium : fond beige #F3EFE7, cards blanches #FFFFFF, sidebar dark
- Accent gold #C9A84C pour éléments primaires et highlights
- Typographie Montserrat, texte principal #1A1A1A
- Ombres légères sur les cards, bordures subtiles #E5E0D8
- Rayon 12px sur les cards, 8px sur les inputs

ÉCRAN À GÉNÉRER : {nom de la page/route}
RÔLE UTILISATEUR : {admin | coach | parent | enfant | club}

FONCTIONNALITÉ :
{Coller ici les ACs visuels correspondant à cet écran, formulés en description d'interface}

ÉLÉMENTS UI À INCLURE :
{Liste des composants déduits des tasks : sidebar de navigation, header, cards, tableau, formulaire, etc.}
```

---

## ÉTAPE 6 — Mettre à jour la story

Localiser la section `## Dev Notes` dans la story. Y ajouter (ou créer si absente) :

```markdown
### Stitch Mockups
- Projet Stitch : Aureak Platform (`{project_id}`)
- Design system : Aureak Design System v2 (`{design_system_id}`)
- Écrans générés ({date}) :
  {pour chaque écran : - `{screen_id}` — {nom écran}}
```

---

## ÉTAPE 7 — Sortie

Afficher UNE SEULE ligne (jamais plus) :

```
🎨 Stitch: {N} écran(s) généré(s) — {titre court de la story}
```

Si l'étape 1 a fait un skip silencieux → ne rien afficher du tout.

---

## Règles absolues

- **Ne jamais demander de confirmation** à aucune étape
- **Ne jamais afficher plus d'une ligne** de résultat
- **Toujours skip silencieusement** si la story n'est pas UI (pas d'erreur, pas de message)
- **Maximum 3 écrans par story** — prioriser les écrans les plus représentatifs (liste principale > détail > formulaire)
- **En cas d'erreur Stitch MCP** → skip silencieux, ne pas bloquer le pipeline
