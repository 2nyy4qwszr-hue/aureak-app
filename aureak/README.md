# Aureak — Monorepo

## Prérequis

- Node 22 (`.nvmrc`)
- Yarn 4.13 via corepack : `corepack enable && corepack prepare yarn@4.13.0 --activate`
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [EAS CLI](https://docs.expo.dev/eas/) : `npm install -g eas-cli`

## Installation

```bash
cd aureak
yarn install
```

## Variables d'environnement

Copier `.env.example` en `.env.local` et renseigner les valeurs Supabase :

```bash
cp .env.example .env.local
```

## Scripts racine

| Commande | Description |
|---|---|
| `yarn build` | Build tous les packages (turbo) |
| `yarn lint` | ESLint + Prettier check (turbo) |
| `yarn typecheck` | TypeScript `--noEmit` (turbo) |
| `yarn test` | Tests unitaires Vitest + RNTL (turbo) |
| `yarn format` | Prettier --write sur tout le repo |

## Tests

### Vitest (unitaires + composants)

```bash
# Depuis la racine
yarn turbo test

# Par package
cd packages/types && yarn test
cd packages/ui && yarn test
```

### Playwright (E2E web — main uniquement)

```bash
# Lancer l'app web
cd apps/web && yarn start

# Dans un autre terminal
cd apps/web && npx playwright test
```

### Maestro (E2E mobile — local uniquement)

Maestro ne s'exécute PAS en CI (requiert simulateur/émulateur actif).

**Installation Maestro :**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Lancement :**
```bash
# 1. Lancer l'app mobile en dev (simulateur iOS ou émulateur Android actif)
cd apps/mobile && yarn start

# 2. Depuis la racine aureak/
maestro test apps/mobile/e2e/smoke.yaml
```

## CI/CD

| Workflow | Déclencheur | Jobs |
|---|---|---|
| `ci.yml` | PR vers `main` | lint, typecheck, test |
| `eas-build.yml` | Merge vers `main` | eas-build, playwright-e2e |

### Secrets GitHub à configurer

| Secret | Usage |
|---|---|
| `SUPABASE_URL` | Tests Vitest + Playwright E2E |
| `SUPABASE_ANON_KEY` | Tests Vitest + Playwright E2E |
| `EXPO_TOKEN` | Auth EAS Build — générer via `eas whoami --token` |

### Secrets EAS à configurer (builds mobile)

```bash
eas secret:create --scope project --name SUPABASE_URL --value "https://..."
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "eyJ..."
```

## Structure

```
aureak/
├── apps/
│   ├── mobile/          # Expo iOS + Android
│   └── web/             # Expo Router web (admin/parent)
└── packages/
    ├── types/           # @aureak/types — enums + entités TS
    ├── theme/           # @aureak/theme — design tokens + Tamagui config
    ├── ui/              # @aureak/ui — composants partagés
    ├── api-client/      # @aureak/api-client — seul accès Supabase
    ├── business-logic/  # @aureak/business-logic — logique métier partagée
    └── media-client/    # @aureak/media-client — stub Phase 2
```
