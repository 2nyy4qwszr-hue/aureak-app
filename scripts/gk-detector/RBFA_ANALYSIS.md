# RBFA Technical Analysis — Story 30-1
# Findings from Task 0 investigation (2026-03-20)

## Summary

The RBFA website (`www.rbfa.be`) is an Angular SPA — `curl` returns an empty shell.
All data comes from a **GraphQL API** at `https://datalake-prod2018.rbfa.be/graphql`.

The API uses **Apollo Persisted Queries (APQ)** — queries are sent as SHA256 hashes.
Introspection is disabled in production.

---

## Task 0.1 — `numaffil` as URL key

**Result: DOES NOT WORK.**

- Tested: `https://www.rbfa.be/fr/player/602766` → HTTP 404
- The `numaffil` from the CSV (RBFA affiliation number) is NOT a public URL key.
- It remains useful as a traceability field in output, but cannot be used for API lookup.

---

## Task 0.2 — GraphQL Introspection

**Result: DISABLED.**

Apollo Server has `introspection: false` in production.
Strategy: intercept actual browser network requests via Chrome DevTools.

---

## Task 0.3 — DoSearch returns PlayerSearchResult?

**Result: NO.**

`DoSearch` only returns `ClubSearchResult` and `TeamSearchResult`.
Players are NOT searchable via the public GraphQL API.

**Consequence**: The strategy must be **club-based**:
1. Find RBFA club URL ID via DoSearch (by club name + verify by `registrationNumber`)
2. Get all matches for that club
3. Find CSV players in the match lineups by fuzzy name matching

---

## Task 0.4 — Club page via CSV matricule

**Result: INDIRECT — must translate first.**

- The CSV `matricule` column (e.g., `6027`) = RBFA **registration number** (e.g., `06027`)
- The RBFA **URL clubId** (e.g., `2087`) is DIFFERENT from the registration number
- `https://www.rbfa.be/fr/club/6027` → Club Brugge Dames (WRONG — URL uses the numeric clubId, not the matricule)

**Translation**: Use `DoSearch` by club name → find result with matching `registrationNumber` → get `id` (RBFA URL clubId)

Alternatively, DoSearch returns `registrationNumber` directly, so we can:
1. Pad CSV `matricule` with leading zeros to 5 digits
2. DoSearch by club name → match `registrationNumber` field → get clubId

---

## Task 0.5 — Match URL pattern

**Result: CONFIRMED.**

- Match URL: `https://www.rbfa.be/fr/match/{matchId}`
- Match IDs are numeric strings (e.g., `7482609`, `7215541`)

---

## Task 0.6 — GK identification in match sheets

**Result: `badges` field contains `"(GK)"`.**

`GetMatchDetail` returns a `lineup` array of `GroupedPlayer2` objects:
```json
{
  "home": {
    "id": "1831039",
    "lastName": "Beaujean",
    "firstName": "Mathis",
    "shirtNumber": "1",
    "badges": "(GK)",
    "events": [],
    "__typename": "MatchDetailPlayer"
  },
  "away": {
    "id": "1678376",
    "lastName": "Billa",
    "firstName": "Louis",
    "shirtNumber": "1",
    "badges": "(C) (GK)",
    "events": [],
    "__typename": "MatchDetailPlayer"
  }
}
```

- `badges: "(GK)"` → goalkeeper
- `badges: "(C) (GK)"` → captain + goalkeeper
- `badges: "(C)"` → captain (field player)
- `badges: ""` → regular field player

**GK detection rule**: `"(GK)" in badges`

---

## Task 0.8 — Scraping strategy

**Result: Pure GraphQL APQ — no Playwright needed.**

All match data is accessible via the GraphQL API without authentication.
Python `requests` library is sufficient.

---

## Discovered APQ Hashes

All calls use `POST https://datalake-prod2018.rbfa.be/graphql` with:
- `Content-Type: application/json`
- `Origin: https://www.rbfa.be`

### DoSearch (regular query — no APQ hash needed)
```python
body = {
    "operationName": "DoSearch",
    "query": """
        query DoSearch($first: PaginationAmount, $offset: Int, $filter: SearchFilter!,
                       $language: Language!, $channel: Channel!, $location: String!) {
            search(first: $first, offset: $offset, filter: $filter,
                   language: $language, channel: $channel, location: $location) {
                results {
                    ... on ClubSearchResult {
                        id
                        clubName
                        registrationNumber
                    }
                }
            }
        }
    """,
    "variables": {
        "first": 10,
        "offset": 0,
        "filter": {"query": "<club_name>"},
        "language": "fr",
        "channel": "belgianfootball",
        "location": "www.rbfa.be"
    }
}
```

### clubMatchesAssignations (APQ)
- Hash: `eeeb92967d0b593c29f321f717ab2d81179bad5e1efce80a963a7d1ef4fabb41`
- Params: `clubId` (RBFA URL ID), `language: "fr"`, `startDate: "YYYY/MM/DD"`, `endDate: "YYYY/MM/DD"`, `hasLocation: true`
- **CRITICAL**: Date format is `YYYY/MM/DD` (forward slashes, NOT dashes)
- Match states observed: `finished`, `generalForfeit`, `planned`, `forfeitNoPassportsByOneTeam`, `forfeitByOneTeam`, `postponed`
- Only `"finished"` matches have populated lineup data

### GetMatchDetail (APQ)
- Hash: `cd8867b845c206fe7aa75c1ebf7b53cbda0ff030253a45e2e2b4bcc13ee46c9a`
- Params: `matchId`, `language: "fr"`
- Returns: `lineup[]` as `GroupedPlayer2`, `substitutes[]`, `staffLineup[]`
- `lineup` is EMPTY for planned matches, POPULATED for finished matches

### Other useful hashes (for future use)
- `getClub`: `7ed5bdc56f409cf311f9794cc49ec466a45b40b795036f7af16fb2b8bca3cf7b`
- `getClubInfo`: `7c1bd99f0001a20d60208c60d4fb7c99aefdb810b9ee1c4de21a6d6ba4804b58`
- `getClubTeams`: `79a7fb506ae28a8f7de7711dfa2dc37ac1cc8697798fe92b1ada0fffec2e6f22`

---

## Key Data Structures

### GetMatchDetail response
```json
{
  "data": {
    "matchDetail": {
      "id": "7215541",
      "state": "finished",
      "startTime": "2025-09-03T18:30:00",
      "ageGroup": "U16",
      "homeTeam": { "id": "...", "name": "...", "clubId": "...", "registrationNumber": "..." },
      "awayTeam": { "id": "...", "name": "...", "clubId": "...", "registrationNumber": "..." },
      "lineup": [
        {
          "home": { "id": "1831039", "lastName": "Beaujean", "firstName": "Mathis",
                    "shirtNumber": "1", "badges": "(GK)", "events": [] },
          "away": { "id": "1678376", "lastName": "Billa", "firstName": "Louis",
                    "shirtNumber": "1", "badges": "(C) (GK)", "events": [] }
        }
      ],
      "substitutes": [],
      "staffLineup": []
    }
  }
}
```

### clubMatchesAssignations response (per match)
```json
{
  "id": "7215541",
  "state": "finished",
  "title": "U16",
  "ageGroup": "U16",
  "startTime": "2025-09-03T18:30:00",
  "homeTeam": { "name": "...", "clubId": "2057", "id": "...", "logo": "..." },
  "awayTeam": { "name": "...", "clubId": "2087", "id": "...", "logo": "..." },
  "province": "Namur",
  "eventType": "championship"
}
```

---

## Matching Strategy (Club-Based)

Since players are not directly searchable, the strategy is:

1. **Group CSV players by club** (by `matricule` field)
2. **For each club**:
   a. Pad `matricule` to 5 digits: e.g., `"6027"` → `"06027"`
   b. `DoSearch` by club name → filter result where `registrationNumber == padded_matricule`
   c. Get RBFA URL clubId (e.g., `"2087"`)
3. **Get all finished matches** for the club via `clubMatchesAssignations`
   - Date range: full season (e.g., `2025/09/01` to `YYYY/MM/DD` today)
4. **For each finished match**, get lineup via `GetMatchDetail`
5. **For each CSV player**, fuzzy-match their name against lineup players
   - If match found: record role (`GK` if `"(GK)" in badges`)
   - Count GK vs field appearances across all matches
6. **Classify** per AC4 rules

---

## CSV Structure (Membres namur.csv)

- Separator: `;`
- Encoding: Latin-1 (with UTF-8 fallback)
- Date format: `M/DD/YY` (US format, 2-digit year) — all players born before 2000

| Column | Description |
|---|---|
| `province` | Province belge |
| `matricule` | Club registration number (e.g., `6027` → RBFA `06027`) |
| `club` | Club name (e.g., `A.C. LUSTIN`) |
| `nom` | Last name (ALL CAPS) |
| `prénom` | First name (ALL CAPS) |
| `datenaiss` | Birth date `M/DD/YY` |
| `cdesexe` | Gender: `H` / `F` |
| `adresse` | Postal address |
| `cdepost` | Postal code |
| `commune` | City |
| `email` | Email |
| `numaffil` | RBFA player affiliation number (NOT a public URL key — 404 on rbfa.be) |
