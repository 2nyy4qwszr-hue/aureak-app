# Story 41-4 — UX: sidebar collapse

**Epic:** 41
**Status:** ready-for-dev
**Priority:** low

## Story
En tant qu'admin, je veux pouvoir réduire la sidebar en mode icônes afin de libérer de l'espace horizontal pour les tableaux et listes larges.

## Acceptance Criteria
- [ ] AC1: Un bouton `‹` / `›` est visible dans la sidebar pour basculer entre mode étendu (220px) et mode collapsed (48px)
- [ ] AC2: En mode collapsed, seules les icônes des items de navigation sont affichées (labels masqués)
- [ ] AC3: En mode collapsed, un tooltip au survol affiche le label de chaque item
- [ ] AC4: L'état collapsed est persisté dans `localStorage` (key: `sidebar-collapsed`) et restauré au rechargement
- [ ] AC5: La transition entre les deux états est animée (durée 200ms, CSS transition sur `width`)
- [ ] AC6: Le contenu principal s'adapte automatiquement à la largeur de sidebar restante
- [ ] AC7: Chaque item de navigation dans `_layout.tsx` doit avoir une prop `icon` pour le mode collapsed

## Tasks
- [ ] Modifier `aureak/apps/web/app/(admin)/_layout.tsx` — ajouter state `collapsed` initialisé depuis `localStorage`, bouton toggle `‹/›`, transition CSS sur la sidebar
- [ ] Modifier les items de navigation dans `_layout.tsx` — ajouter une prop `icon` (caractère emoji ou string référence icône) à chaque entrée du menu
- [ ] Implémenter le rendu conditionnel: si `collapsed` → afficher seulement l'icône, sinon icône + label
- [ ] Implémenter les tooltips en mode collapsed: `title` attribute HTML sur `<Pressable>` ou composant `Tooltip` si disponible dans `@aureak/ui`
- [ ] Persister `collapsed` dans `localStorage` au changement: `useEffect(() => { localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0') }, [collapsed])`
- [ ] Vérifier QA: `typeof window !== 'undefined'` guard pour localStorage, aucune couleur hardcodée

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/app/(admin)/_layout.tsx`
- Largeurs: étendu = 220px, collapsed = 48px
- Bouton toggle: positionné en bas de la sidebar ou en haut à droite de la sidebar, style discret
- Transition CSS: `style={{ width: collapsed ? 48 : 220, transition: 'width 200ms ease' }}`
- Icônes suggérées par section (emojis ou codes Unicode):
  - Dashboard: 🏠 / `⌂`
  - Séances: 📅 / `◉`
  - Stages: 🏕 / `▦`
  - Joueurs: 👤 / `◎`
  - Clubs: 🏟 / `⬡`
  - Méthodologie: 📚 / `≡`
  - Messages: 💬 / `✉`
  - Paramètres: ⚙ / `✦`
- Si le projet utilise une librairie d'icônes (ex: `@expo/vector-icons`), l'utiliser en priorité
- Pas de migration Supabase nécessaire
- ATTENTION: Sur mobile, la sidebar est en général dans un drawer — ce toggle est uniquement pour le web (condition `Platform.OS === 'web'` si nécessaire)
