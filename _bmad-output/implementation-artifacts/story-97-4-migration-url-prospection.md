# Story 97.4 — Migrer `/developpement/prospection/*` → `/prospection/*`

Status: done

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.4
- **Story key** : `97-4-migration-url-prospection`
- **Priorité** : P1 (prérequis de 97.11)
- **Dépendances** : aucune ; **bloque 97.11**
- **Source** : Audit UI 2026-04-22. L'utilisateur a explicitement demandé la suppression du préfixe `/developpement` — la zone sidebar s'appelle "Prospection" donc l'URL doit refléter ça.
- **Effort estimé** : M (~4-6h — déplacement ~6 pages + 3-4 layouts + ~20-30 imports + redirects)

## Story

As an admin,
I want que les URLs de la zone Prospection soient `/prospection/*` au lieu de `/developpement/prospection/*`,
So that l'URL affichée dans la barre d'adresse reflète directement le libellé sidebar "Prospection", évitant toute confusion avec le dossier `developpement` qui n'existe plus en tant que section sidebar.

## Contexte

### Pages impactées

Pages à déplacer depuis `aureak/apps/web/app/(admin)/developpement/prospection/` :
- `page.tsx` + `index.tsx` — hub prospection
- `attribution/page.tsx` + `index.tsx` — attribution manuelle
- `ressources/page.tsx` — ressources
- `clubs/page.tsx` — liste clubs (CRM clubs)
- `clubs/[prospectId]/page.tsx` — détail club
- `gardiens/page.tsx` + `index.tsx` — liste gardiens
- `gardiens/ajouter/page.tsx` + `index.tsx` — ajout gardien
- `entraineurs/page.tsx` — liste entraîneurs
- `entraineurs/[prospectId]/page.tsx` — détail entraîneur
- `[id]/page.tsx` + `index.tsx` — détail gardien/legacy (à vérifier si encore utilisé ou reliquat)
- `_layout.tsx` (si présent)

Sous-dossiers éventuels à déplacer aussi.

### Pages "developpement" autres

Le dossier `/developpement/` contient aussi `partenariats/page.tsx`. Cette page est-elle un ancien alias redirigeant vers `/partenariat/*` (Epic 92) ou une page active distincte ? À vérifier au QA. Si reliquat → la supprimer. Si active → hors scope (à traiter dans une story séparée).

**Cette story se concentre uniquement sur `developpement/prospection/*` → `/prospection/*`.**

### Composants et helpers

Les composants du domaine Prospection ont été déplacés en 95.1 vers `aureak/apps/web/components/admin/prospection/`. Ils ne bougent pas ici — seuls les fichiers route `app/(admin)/developpement/prospection/` sont déplacés.

### Liens internes

Les liens dans le code pointant sur `/developpement/prospection` doivent être mis à jour :
- `nav-config.ts` (le href "Prospection" pointe sur `/developpement/prospection` actuellement — ligne 56)
- `breadcrumbs` configs éventuelles
- `topbar-config.ts`
- Tout `useRouter().push('/developpement/prospection/...')` ou `<Link href="..."`

## Acceptance Criteria

1. **Nouvelle arborescence** : toutes les routes sous `aureak/apps/web/app/(admin)/prospection/` avec structure miroir :
   ```
   app/(admin)/prospection/
     page.tsx           (anciennement developpement/prospection/page.tsx)
     index.tsx
     _layout.tsx        (si présent dans l'ancien dossier)
     attribution/
     ressources/
     clubs/
       page.tsx
       [prospectId]/page.tsx
     gardiens/
       page.tsx
       index.tsx
       ajouter/
     entraineurs/
       page.tsx
       [prospectId]/page.tsx
     [id]/
       page.tsx (si applicable)
   ```

2. **Ancienne arborescence supprimée** : `aureak/apps/web/app/(admin)/developpement/prospection/` est **supprimée** (pas vide, supprimée complètement).

3. **Redirects 301** : les anciennes URLs redirigent vers les nouvelles. Implémentation Expo Router :
   - Créer `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` temporaire avec `<Redirect href="/prospection" />`
   - Idem pour les sous-routes clés (au minimum : `/clubs`, `/gardiens`, `/entraineurs`, `/attribution`)
   - **OU** implémenter via hook middleware global si le projet en a un
   - Durée de vie des redirects : conserver au moins 1 mois (date-butoir à ajouter en commentaire)

4. **Mise à jour `nav-config.ts`** : ligne 56, remplacer `href: '/developpement/prospection'` par `href: '/prospection'`.

5. **Grep exhaustif liens internes** : `rg "/developpement/prospection" aureak/` → **0 match hors redirects** (et hors commentaires/strings explicatifs).
   - Mettre à jour `topbar-config.ts` si contient des refs
   - Mettre à jour breadcrumb configs
   - Mettre à jour tous les `href="/developpement/prospection..."` dans le code JSX
   - Mettre à jour les `router.push('/developpement/prospection...')`

6. **Imports relatifs** : après déplacement, les imports relatifs (`../../../components/admin/prospection/...`) doivent être recalculés (profondeur change). `cd aureak && npx tsc --noEmit` EXIT 0.

7. **Le dossier `/developpement/` après migration** :
   - Contient uniquement `partenariats/page.tsx` (à traiter séparément ou à laisser si lien fonctionnel, **hors scope 97.4**)
   - Si la seule sous-route restante est une redirection, supprimer tout le dossier et ajouter le redirect au niveau supérieur
   - **Décision à prendre au QA** : documenter dans les completion notes

8. **Test Playwright** :
   - `/prospection` → charge la page hub
   - `/prospection/clubs` → liste clubs
   - `/prospection/gardiens` → liste gardiens
   - `/prospection/entraineurs` → liste entraîneurs
   - `/prospection/clubs/<uuid>` → détail club
   - `/developpement/prospection` → redirect 301 vers `/prospection` (vérifier via network tab Chrome)
   - Console zéro erreur sur les 5 pages

9. **Conformité CLAUDE.md** :
   - Pattern `page.tsx` + `index.tsx` re-export préservé sur chaque route
   - `npx tsc --noEmit` EXIT 0
   - Commit unique ou batch de commits si trop gros (ex. 1 commit "move files" + 1 commit "update imports + redirects")

10. **Non-goals explicites** :
    - **Pas de modification UI** des pages (pas de template application — c'est 97.11)
    - **Pas de changement fonctionnel**
    - **Pas de migration de `/developpement/partenariats`** (à faire dans une story séparée si besoin)

## Tasks / Subtasks

- [ ] **T1 — Inventaire exhaustif** (AC #1, #5)
  - [ ] Lister tous les fichiers sous `app/(admin)/developpement/prospection/`
  - [ ] Grep `/developpement/prospection` dans tout `aureak/apps/web/` pour recenser les liens

- [ ] **T2 — Déplacement des routes** (AC #1, #2)
  - [ ] `git mv app/(admin)/developpement/prospection app/(admin)/prospection`
  - [ ] Vérifier que la structure résultante est correcte
  - [ ] Si `developpement/` devient vide à part `partenariats` → laisser tel quel (hors scope)

- [ ] **T3 — Redirects** (AC #3)
  - [ ] Créer `app/(admin)/developpement/prospection/page.tsx` avec Redirect
  - [ ] Créer les `(admin)/developpement/prospection/{clubs,gardiens,entraineurs,attribution}/page.tsx` avec Redirect
  - [ ] Commenter une date butoir d'ici 1 mois

- [ ] **T4 — Mise à jour liens** (AC #4, #5)
  - [ ] `nav-config.ts:56` → href `/prospection`
  - [ ] `topbar-config.ts` (si refs)
  - [ ] Tout `<Link>`, `router.push`, `useRouter` dans le code

- [ ] **T5 — Imports relatifs** (AC #6)
  - [ ] `npx tsc --noEmit` repérer les imports cassés
  - [ ] Corriger profondeur `../` ou utiliser alias si disponible

- [ ] **T6 — QA** (AC #8, #9)
  - [ ] Playwright sur les 5 URLs cibles
  - [ ] Playwright sur anciennes URLs → vérifier redirect
  - [ ] Console zéro erreur

## Dev Notes

### Pourquoi des redirects plutôt que juste supprimer

Bookmarks admin existants, éventuels liens dans emails internes, raccourcis navigateur. Un 301 pendant 1 mois permet la transition douce. Après 1 mois, les redirects peuvent être supprimés dans une story cleanup.

### Redirect via `<Redirect>` Expo Router

Pattern standard (cf. Epic 92.1 pour `/partenariat/page.tsx`) :
```tsx
import { Redirect } from 'expo-router'
export default function DevProspectionRedirect() {
  return <Redirect href="/prospection" />
}
```

Attention : cela ne retourne pas un vrai HTTP 301 (Expo Router client-side), mais redirige immédiatement côté client. Suffisant pour notre cas d'usage admin.

### Ordre commits

Recommandation (pour faciliter revert) :
1. Commit 1 : `git mv` + adaptations imports relatifs (feat/refactor)
2. Commit 2 : ajout redirects + mise à jour nav-config + grep final

### References

- Dossier source : `aureak/apps/web/app/(admin)/developpement/prospection/`
- Dossier cible : `aureak/apps/web/app/(admin)/prospection/` (à créer)
- Config sidebar : `aureak/apps/web/lib/admin/nav-config.ts:56`
- Composants associés (déjà hors `app/`) : `aureak/apps/web/components/admin/prospection/`
- Story suivante dépendante : 97.11 (template Prospection)
