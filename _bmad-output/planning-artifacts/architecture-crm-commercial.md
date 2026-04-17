---
status: complete
epic: 84
title: Architecture — Registre Commercial Clubs
date: 2026-04-17
---

# Architecture — Registre Commercial Clubs (Epic 84)

## Vue d'ensemble

Module de coordination commerciale ajouté à la plateforme Aureak existante. Les commerciaux consultent l'annuaire clubs (`club_directory`) et loggent leurs contacts pour éviter les doublons de prospection.

**Décision clé :** pas de route group `(commercial)` séparé. Le module vit dans `(admin)/developpement/prospection/` (route placeholder existante Story 63.3). L'admin et les commerciaux partagent la même vue — l'admin en lecture seule, les commerciaux en lecture + écriture.

## Modèle de données

### Nouvelle table : `commercial_contacts`

```sql
commercial_contacts
  id                UUID        PK DEFAULT gen_random_uuid()
  tenant_id         UUID        NOT NULL FK → tenants.id
  club_directory_id UUID        NOT NULL FK → club_directory.id
  commercial_id     UUID        NOT NULL FK → auth.users.id
  contact_name      TEXT        NOT NULL
  contact_role      TEXT
  status            commercial_contact_status NOT NULL DEFAULT 'premier_contact'
  note              TEXT
  contacted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  deleted_at        TIMESTAMPTZ
```

### Nouvel enum : `commercial_contact_status`

```sql
'premier_contact' | 'en_cours' | 'en_attente' | 'pas_de_suite'
```

### Extension enum existant : `user_role`

```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'commercial';
```

### RLS

```sql
-- Commerciaux : lecture tout (même tenant), écriture own
CREATE POLICY commercial_contacts_select ON commercial_contacts
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY commercial_contacts_insert ON commercial_contacts
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND commercial_id = auth.uid()
  );

CREATE POLICY commercial_contacts_update ON commercial_contacts
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND commercial_id = auth.uid()
  );

-- Admin : lecture via la même policy SELECT (même tenant)
-- Pas de policy DELETE — soft-delete uniquement
```

## Couches techniques

### 1. Types (`@aureak/types`)

```typescript
// enums.ts
export type CommercialContactStatus = 'premier_contact' | 'en_cours' | 'en_attente' | 'pas_de_suite'

// entities.ts
export type CommercialContact = {
  id             : string
  tenantId       : string
  clubDirectoryId: string
  commercialId   : string
  contactName    : string
  contactRole    : string | null
  status         : CommercialContactStatus
  note           : string | null
  contactedAt    : string
  createdAt      : string
  updatedAt      : string
  deletedAt      : string | null
}

// Avec données jointes pour l'affichage
export type CommercialContactWithCommercial = CommercialContact & {
  commercialDisplayName: string
}
```

### 2. API Client (`@aureak/api-client`)

Nouveau fichier : `src/admin/commercial-contacts.ts`

```typescript
listCommercialContacts(clubDirectoryId: string): Promise<CommercialContactWithCommercial[]>
listAllCommercialContacts(): Promise<CommercialContactWithCommercial[]>  // pour vue admin
createCommercialContact(params: CreateCommercialContactParams): Promise<CommercialContact>
updateCommercialContact(params: UpdateCommercialContactParams): Promise<CommercialContact>
getClubCommercialStatus(clubDirectoryId: string): Promise<CommercialContactStatus | null>
```

### 3. UI — Routes

```
(admin)/developpement/prospection/
  page.tsx                  → REMPLACE le placeholder actuel
  _components/
    ClubList.tsx            → liste clubs + recherche + badges statut
    ClubCard.tsx            → card club avec badge
    ClubDetail.tsx          → fiche club + contacts
    ContactForm.tsx         → formulaire ajout/edit contact
    ProspectionKPIs.tsx     → compteurs en haut
```

### 4. Flux utilisateur

```
Commercial ouvre /developpement/prospection
  → Liste clubs avec recherche
  → Badge statut par club (agrégé depuis commercial_contacts)
  → Tap sur un club → fiche club (modal ou page)
    → Voit contacts existants (tous commerciaux)
    → Bouton "Ajouter un contact"
      → Formulaire minimal → submit → retour fiche
```

## Décisions d'architecture

| Décision | Choix | Raison |
|---|---|---|
| Pas de route `(commercial)` | Module dans `(admin)` | Route + layout existants, le commercial = un admin avec rôle limité |
| Fiche club = modal | Oui (ou page détail) | À décider à l'implémentation — modal si peu de contenu |
| Recherche côté client | Oui | ~500 clubs max, tout charger en 1 requête |
| Statut club = agrégé | Calculé à la volée | Pas de colonne statut sur `club_directory` — dérivé des contacts |
| commercial_id = auth.uid() | Automatique | Pas de champ "qui" dans le formulaire — toujours l'utilisateur connecté |
