// RBFA GraphQL search client — Story 28-1
// Endpoint découvert via Playwright : https://datalake-prod2018.rbfa.be/graphql
// channel = "belgianfootball" (valeur découverte dans le bundle JS)
// SearchFilter = { query: string } uniquement (pas d'entityTypes)

const RBFA_ENDPOINT    = 'https://datalake-prod2018.rbfa.be/graphql'
const SEARCH_CHANNEL   = 'belgianfootball'
const SEARCH_LANGUAGE  = 'fr'
const SEARCH_LOCATION  = 'www.rbfa.be'
const REQUEST_TIMEOUT  = 10_000

const DO_SEARCH_QUERY = `
  query DoSearch(
    $first: PaginationAmount, $offset: Int,
    $filter: SearchFilter!, $language: Language!,
    $channel: Channel!, $location: String!
  ) {
    search(
      first: $first, offset: $offset,
      filter: $filter, language: $language,
      channel: $channel, location: $location
    ) {
      results {
        ... on ClubSearchResult {
          id
          logo
          clubName
          registrationNumber
        }
      }
    }
  }
`

export type RbfaRawClub = {
  id                : string
  logo              : string | null
  clubName          : string
  registrationNumber: string | null
}

type SearchResponse = {
  data?  : { search?: { results?: Partial<RbfaRawClub>[] } }
  errors?: { message: string }[]
}

async function executeSearch(query: string, first: number): Promise<RbfaRawClub[]> {
  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const res = await fetch(RBFA_ENDPOINT, {
      method : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin'      : 'https://www.rbfa.be',
      },
      body: JSON.stringify({
        operationName: 'DoSearch',
        query        : DO_SEARCH_QUERY,
        variables    : {
          first,
          offset  : 0,
          filter  : { query },
          language: SEARCH_LANGUAGE,
          channel : SEARCH_CHANNEL,
          location: SEARCH_LOCATION,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`RBFA API HTTP ${res.status}`)

    const json: SearchResponse = await res.json()
    if (json.errors?.length) {
      throw new Error(`RBFA GraphQL: ${json.errors[0].message}`)
    }

    const results = json.data?.search?.results ?? []
    return results.filter((r): r is RbfaRawClub => !!r.id && !!r.clubName)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Recherche des clubs RBFA par nom.
 * Retourne les résultats bruts ou lève une erreur après timeout (10s).
 */
export async function searchRbfaClubs(query: string, maxResults = 10): Promise<RbfaRawClub[]> {
  return executeSearch(query, maxResults)
}

const RBFA_CLUB_PAGE_URL = (id: string) => `https://www.rbfa.be/fr/club/${id}`
const FALLBACK_TIMEOUT   = 10_000

/**
 * Tente de récupérer l'URL du logo d'un club depuis sa page HTML sur rbfa.be.
 * Utilisé en fallback quand le GraphQL retourne no_logo.jpg pour un club matché.
 *
 * Sélecteurs inspectés sur rbfa.be/fr/club/{id} (2026-03) :
 *   - <img class="..." src="https://belgianfootball.s3.eu-west-1.amazonaws.com/...">
 *   - L'image principale du club est généralement une balise img dans .club-header
 *     ou contenant "logo" / "crest" / "wappen" dans l'URL ou le src
 *
 * NOTE : rbfa.be est rendu côté serveur (SSR) — le HTML contient les images.
 * Si RBFA migre vers une SPA sans SSR, cette fonction retournera null.
 * En cas d'erreur (CORS, timeout, parse) : retourne null silencieusement.
 */
export async function fetchLogoFromClubPage(rbfaId: string): Promise<string | null> {
  const url = RBFA_CLUB_PAGE_URL(rbfaId)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Aureak Club Sync/1.0' },
      signal : AbortSignal.timeout(FALLBACK_TIMEOUT),
    })
    if (!res.ok) return null

    const html = await res.text()

    // Sélecteur 1 : img sur AWS S3 (CDN belgianfootball)
    // Exemple : src="https://belgianfootball.s3.eu-west-1.amazonaws.com/s3fs-public/clubs/logos/xxx.png"
    const awsMatch = html.match(
      /src="(https:\/\/belgianfootball\.s3[^"]+\.(png|jpg|jpeg|svg|webp))"/i,
    )
    if (awsMatch?.[1]) return awsMatch[1]

    // Sélecteur 2 : img contenant "logo" ou "crest" ou "wappen" dans l'URL
    const logoMatch = html.match(
      /src="(https:\/\/[^"]+(?:logo|crest|wappen)[^"]+\.(png|jpg|jpeg|svg|webp))"/i,
    )
    if (logoMatch?.[1]) return logoMatch[1]

    return null
  } catch {
    // Timeout, CORS, parse error — silencieux
    return null
  }
}
