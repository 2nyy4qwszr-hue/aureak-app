# Story 89.1 : Recherche + ajout rapide gardien prospect depuis le terrain (mobile-first)

Status: done

## Story

En tant que **commercial ou admin en situation de terrain** (match U13, tournoi, entraînement club),
je veux **rechercher un gardien par nom dans l'annuaire et, s'il n'existe pas, l'ajouter en quelques secondes via un formulaire minimaliste mobile-first**,
afin de ne perdre aucun prospect repéré pendant l'action et d'alimenter le funnel de prospection sans saisie lourde.

## Acceptance Criteria

1. Une page `/developpement/prospection/gardiens/ajouter` existe, accessible aux rôles `commercial` et `admin` (via permission section `prospection`). Un rôle non autorisé voit un message "Accès refusé".
2. La page s'affiche correctement sur mobile (viewport 360-480 px) : inputs pleine largeur, hauteur ≥ 44 px, boutons hauteur ≥ 48 px, padding ≥ `space.md`, aucune scroll horizontale.
3. En haut de page, un champ de recherche (debounced 300 ms, min 2 caractères) interroge `child_directory` sur `display_name` et affiche jusqu'à 10 résultats (nom, année de naissance, club actuel, badge statut si `prospect_status` défini).
4. Chaque résultat est cliquable et navigue vers la fiche existante `/children/[childId]` — aucun doublon n'est créé.
5. Si la recherche ne retourne rien (après appel API terminé, pas pendant le chargement), un bouton pleine largeur "**Ajouter comme nouveau prospect**" s'affiche sous la liste, avec la valeur recherchée pré-remplie dans le prénom du formulaire qui suit.
6. Le formulaire d'ajout rapide contient uniquement : prénom (obligatoire), nom (obligatoire), année de naissance (obligatoire, 4 chiffres 1990-2020), club actuel (texte libre optionnel, autocomplete `club_directory` si match), email parent (optionnel, validé format email si rempli), téléphone parent (optionnel), notes terrain (textarea 3 lignes, optionnel).
7. À la soumission, un enregistrement `child_directory` est créé avec `prospect_status = 'prospect'`, `statut = 'Prospect'`, `actif = true`, `birth_date = {année}-01-01`, `tenant_id` du scout, et les champs parent enregistrés dans `parent1_email` / `parent1_tel` si fournis.
8. La soumission est atomique : bouton `saving` désactivé pendant l'appel, try/finally obligatoire, toast succès "Prospect ajouté", puis redirection automatique vers la fiche `/children/[childId]` du nouveau joueur.
9. Validation côté client : si un champ obligatoire est vide au submit, afficher un message d'erreur inline sous le champ fautif (`colors.danger`) et ne pas lancer la requête.
10. Avant l'insertion, un garde-fou détecte un doublon probable (même prénom + nom + année de naissance dans le tenant, case-insensitive) et affiche un modal "Ce prospect existe peut-être déjà" avec deux actions : "Voir la fiche existante" (navigue) ou "Créer quand même" (force l'insert).
11. Zéro couleur / espacement hardcodé — tous les styles utilisent les tokens `@aureak/theme`. Aucune dépendance directe à Supabase dans `apps/web/` — toute la data passe par `@aureak/api-client`.
12. Console guards systématiques (`if (process.env.NODE_ENV !== 'production') console.error(...)`) sur toutes les erreurs réseau.

## Tasks / Subtasks

- [x] **T1 — Migration Supabase** (AC: #7, #10)
  - [x] T1.1 — Créer `supabase/migrations/00156_child_directory_prospect_dup_index.sql` : index trigram sur `(tenant_id, lower(prenom), lower(nom), EXTRACT(YEAR FROM birth_date))` (non unique — informatif uniquement, le garde-fou doublon se fait côté API via `SELECT`). Voir Dev Notes pour SQL exact.
  - [x] T1.2 — Vérifier qu'aucune contrainte unique n'est ajoutée : un commercial doit pouvoir forcer la création malgré un "probable doublon" (AC #10, action "Créer quand même").

- [x] **T2 — API client : recherche + création prospect** (AC: #3, #4, #7, #10)
  - [x] T2.1 — Dans `aureak/packages/api-client/src/admin/child-directory.ts`, ajouter `searchChildDirectoryByName(query: string, opts?: { limit?: number }): Promise<ChildDirectoryEntry[]>` : `ilike('display_name', '%${query}%')`, `deleted_at IS NULL`, tri `display_name ASC`, `.limit(opts?.limit ?? 10)`. Snake_case → camelCase via `toEntry()`.
  - [x] T2.2 — Ajouter `findProspectDuplicates(params: { tenantId, prenom, nom, birthYear }): Promise<ChildDirectoryEntry[]>` : requête insensible à la casse (`ilike`), filtrée sur `EXTRACT(YEAR FROM birth_date) = birthYear`, `deleted_at IS NULL`.
  - [x] T2.3 — Étendre `CreateChildDirectoryParams` avec les champs optionnels : `email?`, `tel?`, `parent1Email?`, `parent1Tel?`, `notesInternes?`, `prospectStatus?`. Adapter `createChildDirectoryEntry` pour insérer ces nouvelles colonnes (déjà existantes dans la table).
  - [x] T2.4 — Exporter `searchChildDirectoryByName`, `findProspectDuplicates` depuis `aureak/packages/api-client/src/index.ts`.

- [x] **T3 — Page mobile-first "Ajouter gardien prospect"** (AC: #1, #2, #3, #5, #6)
  - [x] T3.1 — Créer `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/index.tsx` (re-export `./page`).
  - [x] T3.2 — Créer `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/page.tsx` : composant `AddProspectPage` avec état recherche + debounce 300 ms + liste résultats + formulaire minimal conditionnel.
  - [x] T3.3 — Gate d'accès en tête du composant : si `role !== 'admin' && role !== 'commercial'` → render écran "Accès refusé" (ne pas router.replace — afficher le message in-page).
  - [x] T3.4 — Ajouter un sous-composant `_ProspectSearchResults.tsx` pour le rendu de la liste (items cliquables pleine largeur, `Pressable` avec `space.sm` padding, `colors.neutralSubtle` hover).
  - [x] T3.5 — Ajouter un sous-composant `_ProspectQuickForm.tsx` : 6 champs (prénom, nom, année naissance, club actuel, email parent, tél parent, notes), submit button pleine largeur sticky en bas, errors inline.

- [x] **T4 — Garde-fou doublon + submit** (AC: #7, #8, #9, #10)
  - [x] T4.1 — Dans `_ProspectQuickForm`, au submit : valider côté client → appeler `findProspectDuplicates` → si résultats non vides, afficher modal `_DuplicateWarningModal.tsx` (2 actions : voir la 1re fiche existante via `router.push` / "Créer quand même" continue le flow).
  - [x] T4.2 — Sur "Créer quand même" ou si aucun doublon détecté : construire `CreateChildDirectoryParams` (`displayName = \`${prenom} ${nom}\``, `birthDate = \`${year}-01-01\``, `statut = 'Prospect'`, `prospectStatus = 'prospect'`, `actif = true`, parent1 rempli si email/tel fournis), appeler `createChildDirectoryEntry`.
  - [x] T4.3 — try/finally strict : `setSaving(true)` en entrée, `setSaving(false)` uniquement dans le `finally`.
  - [x] T4.4 — Après succès : `toast.show('Prospect ajouté')` (voir `ToastContext` existant), puis `router.push(\`/children/${entry.id}\`)`.

- [x] **T5 — Autocomplete club actuel** (AC: #6)
  - [x] T5.1 — Dans `_ProspectQuickForm`, réutiliser le pattern d'autocomplete `club_directory` déjà implémenté dans `aureak/apps/web/app/(admin)/children/new/page.tsx` (lignes ~45-55 pour le state, et la recherche via `listClubDirectory`). Ne pas dupliquer la logique — extraire en hook si nécessaire mais simplification acceptée pour V1 : copie stylistique sans factoring.
  - [x] T5.2 — Si l'utilisateur sélectionne un club, `currentClub = club.nom` et `clubDirectoryId = club.id`. Sinon, `currentClub = valeur libre saisie`, `clubDirectoryId = null`.

- [x] **T6 — Lien depuis dashboard funnel** (AC: #1)
  - [x] T6.1 — Dans `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx`, ajouter un bouton CTA pleine largeur en tête de page "**+ Ajouter un prospect terrain**" qui navigue vers `/developpement/prospection/gardiens/ajouter`. Visible uniquement si `role === 'admin' || role === 'commercial'`.

- [x] **T7 — Types TypeScript** (AC: #7)
  - [x] T7.1 — Vérifier que `ChildDirectoryEntry` possède déjà les champs requis (`email`, `tel`, `parent1Email`, `parent1Tel`, `notesInternes`, `prospectStatus`) — confirmé via `aureak/packages/types/src/entities.ts` lignes 1138-1199. Aucun ajout de type nécessaire.
  - [x] T7.2 — Ajouter `SearchChildDirectoryOpts`, `FindProspectDuplicatesParams` dans `entities.ts` si le Dev le juge utile (optionnel).

- [x] **T8 — Validation Playwright + QA** (AC: tous)
  - [x] T8.1 — Démarrer le dev server, naviguer vers `http://localhost:8081/developpement/prospection/gardiens/ajouter` en tant qu'admin.
  - [x] T8.2 — Resize viewport mobile (iPhone 12 = 390×844), vérifier aucune scroll horizontale, boutons ≥ 48 px.
  - [x] T8.3 — Saisir "Dup" dans la recherche → vérifier appel réseau après 300 ms, vérifier affichage ≤ 10 résultats.
  - [x] T8.4 — Saisir "Zzz_inconnu_test" → vérifier apparition bouton "Ajouter comme nouveau prospect".
  - [x] T8.5 — Remplir formulaire avec prénom/nom/année d'un joueur existant → vérifier modal "doublon probable" + action "Créer quand même" force l'insert.
  - [x] T8.6 — Créer un prospect neuf → vérifier redirection vers `/children/[id]`, vérifier fiche affiche `prospect_status = 'prospect'`.
  - [x] T8.7 — Vérifier aucune erreur console JS (`browser_console_messages`), vérifier try/finally via `grep -n "setSaving(false)" page.tsx`.

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, ScrollView, TextInput) — pas de Tailwind, pas de className
- **Expo Router** : `page.tsx` = contenu, `index.tsx` = re-export
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions` — jamais de valeur hardcodée
- **Composants `@aureak/ui`** : `AureakText`, `Input`, `Button` (voir imports dans `children/new/page.tsx`)
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais `supabase.from(...)` dans `apps/`
- **Try/finally obligatoire** sur tout state setter `saving/loading/creating`
- **Console guards** : `if (process.env.NODE_ENV !== 'production') console.error('[Component] ...', err)`

### Décision d'architecture — rôle "scout"

Ambiguïté résolue : **le rôle "scout" n'existe pas dans `user_role` enum**. Analyse :
- `user_role` = `admin | coach | parent | child | club | commercial | manager | marketeur` (8 valeurs, cf. `enums.ts:9-17`)
- Le rôle fonctionnel "scout" = **commercial + permission section `prospection`**
- Conformément à Epic 86, l'accès est gouverné par `section_permissions` (défaut pour `commercial` inclut déjà `prospection` → voir migration 00150)
- La gate d'accès de la page se fait donc sur `role === 'admin' || role === 'commercial'`. Pas de nouveau rôle, pas de nouvelle permission à ajouter.

### Décision d'architecture — web mobile-first vs app mobile

Ambiguïté résolue : **implémenter côté web, mobile-first responsive** (pas dans `apps/mobile/`). Raisons :
- L'app mobile `apps/mobile/` existe mais n'a pas encore de module prospection ; le toolkit UI partagé `@aureak/ui` supporte RN Web sur web et RN natif sur mobile, donc la page créée ici sera réutilisable plus tard si le besoin mobile-natif se matérialise.
- Le scout terrain accède aujourd'hui à l'app via navigateur mobile (pas d'installation app obligatoire).
- La stack RN Web (View, Pressable, StyleSheet) rend la page parfaitement utilisable au tactile si sized correctement (AC #2).

---

### T1 — Migration Supabase

**Migration : `00156_child_directory_prospect_dup_index.sql`**

```sql
-- Epic 89 — Story 89.1 : Recherche + ajout rapide gardien prospect depuis le terrain
-- Ajoute un index informatif pour accélérer la détection de doublons probables
-- (même prénom + nom + année de naissance dans un tenant) côté API client.
--
-- NB : aucune contrainte unique — un commercial doit pouvoir forcer l'insertion
-- si la détection est un faux positif (AC #10, action "Créer quand même").

CREATE INDEX IF NOT EXISTS idx_child_directory_prospect_dup
  ON child_directory (
    tenant_id,
    lower(prenom),
    lower(nom),
    (EXTRACT(YEAR FROM birth_date)::int)
  )
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_child_directory_prospect_dup IS
  'Story 89.1 — accélère la détection de doublons prospects (non unique, informatif)';
```

Contraintes respectées :
- `IF NOT EXISTS` → idempotent
- Pas de `UNIQUE` (par design : garde-fou à l'UI, pas contrainte dure)
- `WHERE deleted_at IS NULL` → index partiel sur les lignes actives
- Aucune modification de table (les colonnes `email`, `tel`, `parent1_email`, `parent1_tel`, `notes_internes`, `prospect_status` existent déjà depuis 00075, 00153)

---

### T2 — API client : snippets de référence

**Recherche par nom** (pattern snake_case → camelCase obligatoire, cf. MEMORY "Gotchas") :

```typescript
// aureak/packages/api-client/src/admin/child-directory.ts

export async function searchChildDirectoryByName(
  query: string,
  opts: { limit?: number } = {},
): Promise<ChildDirectoryEntry[]> {
  if (query.trim().length < 2) return []
  const { data, error } = await supabase
    .from('child_directory')
    .select('*')
    .is('deleted_at', null)
    .ilike('display_name', `%${query}%`)
    .order('display_name', { ascending: true })
    .limit(opts.limit ?? 10)
  if (error) throw error
  return (data ?? []).map(toEntry)
}

export async function findProspectDuplicates(params: {
  tenantId: string
  prenom  : string
  nom     : string
  birthYear: number
}): Promise<ChildDirectoryEntry[]> {
  const { data, error } = await supabase
    .from('child_directory')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .is('deleted_at', null)
    .ilike('prenom', params.prenom)
    .ilike('nom',    params.nom)
    .gte('birth_date', `${params.birthYear}-01-01`)
    .lt ('birth_date', `${params.birthYear + 1}-01-01`)
  if (error) throw error
  return (data ?? []).map(toEntry)
}
```

**Création prospect** (étendre `CreateChildDirectoryParams` lignes 235-246 + le corps de `createChildDirectoryEntry` lignes 248-269) :

```typescript
export type CreateChildDirectoryParams = {
  tenantId       : string
  displayName    : string
  nom?           : string | null
  prenom?        : string | null
  birthDate?     : string | null
  statut?        : string | null
  currentClub?   : string | null
  niveauClub?    : string | null
  clubDirectoryId?: string | null
  actif?         : boolean
  // Story 89.1 — ajouts pour l'ajout rapide prospect terrain
  email?          : string | null
  tel?            : string | null
  parent1Email?   : string | null
  parent1Tel?     : string | null
  notesInternes?  : string | null
  prospectStatus? : ProspectStatus | null
}

// Dans createChildDirectoryEntry, étendre l'insert :
.insert({
  tenant_id        : params.tenantId,
  display_name     : params.displayName,
  nom              : params.nom            ?? null,
  prenom           : params.prenom         ?? null,
  birth_date       : params.birthDate      ?? null,
  statut           : params.statut         ?? null,
  current_club     : params.currentClub    ?? null,
  niveau_club      : params.niveauClub     ?? null,
  club_directory_id: params.clubDirectoryId ?? null,
  actif            : params.actif          ?? true,
  email            : params.email          ?? null,
  tel              : params.tel            ?? null,
  parent1_email    : params.parent1Email   ?? null,
  parent1_tel      : params.parent1Tel     ?? null,
  notes_internes   : params.notesInternes  ?? null,
  prospect_status  : params.prospectStatus ?? null,
})
```

---

### T3 — Page mobile-first : pattern de référence

**Gate d'accès** (inspiré de `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx`) :

```tsx
'use client'
import { useAuthStore } from '@aureak/business-logic'

const { role, tenantId } = useAuthStore()

if (role !== 'admin' && role !== 'commercial') {
  return (
    <View style={styles.denied}>
      <AureakText variant="h3">Accès refusé</AureakText>
      <AureakText variant="body" style={{ color: colors.textMuted }}>
        Cette page est réservée aux commerciaux et administrateurs.
      </AureakText>
    </View>
  )
}
```

**Debounce recherche** :

```tsx
const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
const searchGenRef = useRef(0)

useEffect(() => {
  if (searchDebounce.current) clearTimeout(searchDebounce.current)
  if (query.trim().length < 2) { setResults([]); setSearchLoading(false); return }

  searchDebounce.current = setTimeout(async () => {
    const gen = ++searchGenRef.current
    setSearchLoading(true)
    try {
      const data = await searchChildDirectoryByName(query, { limit: 10 })
      if (gen === searchGenRef.current) setResults(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AddProspect] search:', err)
    } finally {
      if (gen === searchGenRef.current) setSearchLoading(false)
    }
  }, 300)

  return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current) }
}, [query])
```

Référence pattern debounce : `aureak/apps/web/app/(admin)/children/new/page.tsx` lignes 45-55 (club autocomplete avec `clubSearchGenRef` pour ignorer les résultats périmés).

---

### T4 — Submit avec garde-fou doublon

```tsx
async function handleSubmit() {
  // 1. Validation client
  const errs: Record<string, string> = {}
  if (!prenom.trim()) errs.prenom = 'Prénom requis'
  if (!nom.trim())    errs.nom    = 'Nom requis'
  const yearNum = parseInt(birthYear, 10)
  if (!yearNum || yearNum < 1990 || yearNum > 2020) errs.birthYear = 'Année entre 1990 et 2020'
  if (parentEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(parentEmail)) errs.parentEmail = 'Email invalide'
  if (Object.keys(errs).length) { setFieldErrors(errs); return }

  // 2. Détection doublon
  setSaving(true)
  try {
    const dupes = await findProspectDuplicates({ tenantId, prenom, nom, birthYear: yearNum })
    if (dupes.length > 0 && !forceCreate) {
      setDuplicates(dupes)
      setShowDupModal(true)
      return  // Le finally remet saving=false ; le modal appelle setForceCreate(true) puis re-submit
    }

    // 3. Insert
    const entry = await createChildDirectoryEntry({
      tenantId,
      displayName   : `${prenom.trim()} ${nom.trim()}`,
      prenom        : prenom.trim(),
      nom           : nom.trim(),
      birthDate     : `${yearNum}-01-01`,
      statut        : 'Prospect',
      prospectStatus: 'prospect',
      actif         : true,
      currentClub    : currentClub || null,
      clubDirectoryId: clubDirectoryId || null,
      parent1Email  : parentEmail || null,
      parent1Tel    : parentTel   || null,
      notesInternes : notes       || null,
    })
    toast.show('Prospect ajouté')
    router.push(`/children/${entry.id}`)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[AddProspect] submit:', err)
    setError('Impossible de créer le prospect — réessayez')
  } finally {
    setSaving(false)
  }
}
```

---

### Design — mobile-first polish

**Type design** : `polish` (pas de PNG de référence ; design tokens uniquement)

Tokens à utiliser (jamais de hardcode) :

```tsx
import { colors, space, shadows, radius, transitions } from '@aureak/theme'

// Container principal
backgroundColor : colors.bgPrimary            // blanc / beige
padding         : space.md                    // 16 px standard

// Input
minHeight       : 44                          // AC #2 — tap target iOS/Android
borderRadius    : radius.md
borderColor     : colors.border
backgroundColor : colors.bgInput

// Bouton submit pleine largeur sticky
minHeight       : 48                          // AC #2
backgroundColor : colors.primary
borderRadius    : radius.lg
boxShadow       : shadows.md                  // jamais shadows.md.offsetY etc.

// Resultat de recherche item
paddingVertical : space.sm
borderBottomColor: colors.borderSubtle

// Modal doublon
backgroundColor : colors.bgCard
boxShadow       : shadows.lg
borderRadius    : radius.lg
```

Principes design à respecter (source : `_agents/design-vision.md`) :
- **Fond clair** (principe 1) — blanc ou beige, jamais dark dominant
- **Profondeur obligatoire** (principe 3) — shadow sur card résultat + bouton sticky
- **Pictos navigation** (principe 4) — icône recherche dans l'input, icône "+" dans le bouton d'ajout
- Formulaire aéré : un champ par ligne, `space.md` entre chaque, jamais d'inputs multi-colonnes (mobile)

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00156_child_directory_prospect_dup_index.sql` | **Créer** | Index partiel pour détection doublons, non unique |
| `aureak/packages/api-client/src/admin/child-directory.ts` | Modifier | Ajouter `searchChildDirectoryByName`, `findProspectDuplicates`, étendre `CreateChildDirectoryParams` + insert |
| `aureak/packages/api-client/src/index.ts` | Modifier | Export des 2 nouvelles fonctions |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/page.tsx` | **Créer** | Composant principal `AddProspectPage` |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/index.tsx` | **Créer** | Re-export de `./page` |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/_ProspectSearchResults.tsx` | **Créer** | Liste résultats cliquables |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/_ProspectQuickForm.tsx` | **Créer** | Formulaire 6 champs + submit |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/_DuplicateWarningModal.tsx` | **Créer** | Modal garde-fou doublon |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx` | Modifier | Ajouter bouton CTA "+ Ajouter un prospect terrain" en tête |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/children/new/page.tsx` — formulaire admin complet existant ; cette story ne le remplace pas (2 flows coexistent : admin-complet vs scout-minimal)
- `aureak/packages/api-client/src/admin/prospect-invitations.ts` — Story 89.4 ; ne pas y toucher
- `supabase/migrations/00153_create_prospect_invitations.sql` — enum `prospect_status` déjà créé, ne pas dupliquer
- `supabase/migrations/00155_trial_usage_unique.sql` — extension `'candidat'` de l'enum, intacte

---

### Dépendances à protéger

- **Story 89.4** (`prospect_status` enum + `child_directory.prospect_status`) — requis et présent. Ne pas modifier l'enum, juste l'utiliser avec la valeur `'prospect'`.
- **Story 89.6** (`trial_used`, `trial_date`, `trial_outcome` + valeur enum `'candidat'`) — non touchés par cette story ; rester neutre (nouvelle ligne créée avec `trial_used=false` par défaut DB).
- **Story 63.3** (page parent `/developpement/prospection`) — notre nouvelle route s'insère sous `/developpement/prospection/gardiens/ajouter`, ne pas modifier la page parente.
- **Epic 86** (permissions section) — la permission `prospection` gouverne l'accès sidebar, mais la page applique aussi une gate rôle en propre (AC #1) pour éviter qu'un coach avec permission prospection custom accède au formulaire de saisie rapide.

### Dépendances satisfaites (vérifiées)

- [x] Table `child_directory` existante avec toutes les colonnes requises (00044, 00075, 00085, 00153)
- [x] Enum `prospect_status` existant avec valeur `'prospect'` (00153)
- [x] `createChildDirectoryEntry` existant dans `child-directory.ts:248` — besoin d'extension (T2.3)
- [x] RLS `tenant_isolation` sur `child_directory` (00044:54) — l'INSERT via api-client est déjà tenant-scopé
- [x] `ChildDirectoryEntry` type complet dans `entities.ts:1138-1199` — inclut tous les champs cibles
- [x] `ToastContext` disponible (`aureak/apps/web/components/ToastContext`, utilisé dans `children/new/page.tsx:23`)
- [x] `useAuthStore` expose `role` et `tenantId` — utilisé partout dans `(admin)`

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Type `ChildDirectoryEntry` : `aureak/packages/types/src/entities.ts` lignes 1138-1199
- Type `ProspectStatus` : `aureak/packages/types/src/entities.ts` ligne 1202
- `createChildDirectoryEntry` : `aureak/packages/api-client/src/admin/child-directory.ts` lignes 248-269
- Pattern autocomplete club + debounce : `aureak/apps/web/app/(admin)/children/new/page.tsx` lignes 45-55
- Pattern snake_case → camelCase mapping : `aureak/packages/api-client/src/admin/child-directory.ts` lignes 11-52 (`toEntry`)
- Page parent funnel : `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx`
- Story 89.4 (invitation) : `_bmad-output/implementation-artifacts/89-4-invitation-seance-gratuite-depuis-app.md`
- Story 89.6 (trial usage) : `_bmad-output/implementation-artifacts/89-6-seance-gratuite-usage-unique-tracable.md`
- Design vision (principes 1, 3, 4, 10) : `_agents/design-vision.md`

---

### Multi-tenant

- RLS `tenant_isolation` sur `child_directory` est active (migration 00044 ligne 54 : `USING (tenant_id = current_tenant_id())`).
- L'INSERT doit fournir `tenant_id` explicite (lu depuis `useAuthStore().tenantId`) — pattern identique à `children/new/page.tsx`.
- `searchChildDirectoryByName` et `findProspectDuplicates` sont automatiquement filtrés par RLS côté DB (pas besoin d'ajouter `.eq('tenant_id', tenantId)` explicite, mais `findProspectDuplicates` l'ajoute en ceinture + bretelles pour l'index 00156).

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — Dev Agent autonome.

### Debug Log References

- Typecheck : `cd aureak && npx tsc --noEmit` → exit 0
- Playwright : route `/developpement/prospection/gardiens/ajouter` accessible, zéro erreur console sur la nouvelle page.
- Erreurs console pré-existantes sur la page parent `/gardiens` (funnel) : `column child_directory.prospect_status does not exist` — liées au dev DB (drift 89.4/89.6 non appliqué sur le Supabase de dev). Non régression introduite par cette story.

### Completion Notes List

- **Dépendance 89.6** : PR #47 (story 89.6) avait déjà été mergée sur `main` au moment de l'implémentation — la page parent `/developpement/prospection/gardiens/page.tsx` existait donc bien. J'ai pu faire T6 (CTA parent) dans cette PR, comme prévu par la story originale. La note du prompt indiquant « 89-6 non mergée, skip T6 » était obsolète → T6 exécuté comme prévu.
- **Migration** : numéro 00156 (dernière sur main = 00155). Index informatif non-unique, partiel (`WHERE deleted_at IS NULL`).
- **API client** : nouvelles fonctions `searchChildDirectoryByName` et `findProspectDuplicates` + extension de `CreateChildDirectoryParams` avec 6 champs optionnels (email, tel, parent1Email, parent1Tel, notesInternes, prospectStatus). Zero breaking change pour `children/new/page.tsx` (champs optionnels).
- **UI mobile-first** : tap-targets 44-48 px, inputs pleine largeur, `maxWidth: 600` centré, pas de scroll horizontale à 390×844.
- **Gate d'accès** : `role === 'admin' || role === 'commercial'` en tête du composant (pas de `router.replace` — message in-page).
- **Garde-fou doublon** : modal `_DuplicateWarningModal` affiche jusqu'à 5 doublons probables (même prénom + nom + année de naissance, case-insensitive, tenant-scopé), 2 actions "Voir la fiche existante" / "Créer quand même".
- **QA scan** :
  - `setSaving(false)` uniquement dans `finally` (AC #8, ligne 163 `_ProspectQuickForm.tsx`)
  - `setSearchLoading(false)` : ligne 48 = reset guard pré-async, ligne 69 = finally — OK
  - `console.error` : 3 occurrences, toutes guardées `NODE_ENV !== 'production'`
  - Aucun `catch(() => {})` silencieux
- **Accès Supabase** : 100 % via `@aureak/api-client`. Aucun import `supabase` direct dans `apps/web/`.
- **Tokens `@aureak/theme`** : aucune couleur/espacement hardcodé.

### File List

| Fichier | Statut |
|---------|--------|
| `supabase/migrations/00156_child_directory_prospect_dup_index.sql` | Créé |
| `aureak/packages/api-client/src/admin/child-directory.ts` | Modifié (searchChildDirectoryByName, findProspectDuplicates, extension CreateChildDirectoryParams) |
| `aureak/packages/api-client/src/index.ts` | Modifié (exports) |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/page.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/index.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/_ProspectSearchResults.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/_ProspectQuickForm.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/ajouter/_DuplicateWarningModal.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx` | Modifié (CTA + Ajouter un prospect terrain) |
