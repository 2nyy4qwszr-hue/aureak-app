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
