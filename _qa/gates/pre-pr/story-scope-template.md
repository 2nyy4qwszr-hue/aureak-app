# Scope — Story XX-Y

> Créer ce fichier AU DÉBUT de l'implémentation, pas après.
> Renommer : `story-{XX-Y}-scope.md`
> Coller la liste des fichiers dans les prompts agents (section "Fichiers à analyser").

---

**Story** : XX-Y
**Date début** : YYYY-MM-DD
**Branche** : `feature/story-XX-Y-slug`

---

## Fichiers modifiés (mettre à jour au fil de l'implémentation)

### Nouveaux fichiers
```
apps/web/app/(admin)/...
packages/api-client/src/...
```

### Fichiers modifiés
```
packages/types/src/entities.ts
packages/types/src/enums.ts
```

### Migrations
```
supabase/migrations/000XX_nom.sql
```

### Edge Functions
```
supabase/functions/nom-fonction/index.ts
```

---

## Agents à déclencher

- [x] Code Reviewer — toujours
- [ ] Migration Validator — si ligne "Migrations" non vide
- [ ] Security Auditor — si auth / RLS / données sensibles / nouvelle table

**Raison Security Auditor** : _(justifier ou laisser vide si non applicable)_

---

## Notes d'implémentation

_(décisions prises pendant l'implémentation qui peuvent impacter la review)_
