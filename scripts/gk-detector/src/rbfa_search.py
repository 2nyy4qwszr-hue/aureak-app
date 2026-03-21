"""rbfa_search.py — Find RBFA URL club ID from CSV club data."""

from __future__ import annotations

import logging
from typing import Optional

from src.rbfa_client import RbfaClient
from src.normalize import normalize_name

logger = logging.getLogger(__name__)

DO_SEARCH_QUERY = """
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
        clubName
        registrationNumber
      }
    }
  }
}
"""


def _pad_matricule(matricule: str) -> str:
    """Pad CSV matricule to 5 digits: '6027' → '06027'."""
    m = matricule.strip().lstrip("0") or "0"
    try:
        return str(int(m)).zfill(5)
    except ValueError:
        return matricule.strip()


def search_club_rbfa_id(
    club_name: str,
    matricule: Optional[str],
    client: RbfaClient,
) -> Optional[str]:
    """
    Find RBFA URL club ID from club name + optional registration number.

    Strategy:
    1. DoSearch by club name (returns ClubSearchResult with id + registrationNumber)
    2. If matricule provided: prefer result where registrationNumber matches
    3. Fallback: best name similarity match

    Returns RBFA URL clubId (e.g., "2087") or None if not found.
    """
    if not club_name:
        return None

    padded = _pad_matricule(matricule) if matricule else None

    body = {
        "operationName": "DoSearch",
        "query": DO_SEARCH_QUERY,
        "variables": {
            "first": 15,
            "offset": 0,
            "filter": {"query": club_name},
            "language": "fr",
            "channel": "belgianfootball",
            "location": "www.rbfa.be",
        },
    }
    try:
        data = client.post_graphql(body)
    except Exception as e:
        logger.error("DoSearch failed for '%s': %s", club_name, e)
        return None

    results = data.get("data", {}).get("search", {}).get("results") or []
    clubs = [r for r in results if r.get("id") and r.get("clubName")]

    if not clubs:
        logger.debug("No clubs found for '%s'", club_name)
        return None

    # Priority 1: exact registration number match
    if padded:
        for club in clubs:
            if club.get("registrationNumber") == padded:
                logger.info(
                    "Club match by reg# %s → clubId=%s (%s)",
                    padded, club["id"], club["clubName"],
                )
                return club["id"]

    # Priority 2: best name similarity
    norm_search = normalize_name(club_name)
    best_id = None
    best_score = 0.0
    for club in clubs:
        norm_result = normalize_name(club.get("clubName", ""))
        try:
            from fuzzywuzzy import fuzz
            score = fuzz.token_set_ratio(norm_search, norm_result) / 100.0
        except ImportError:
            score = 1.0 if norm_search == norm_result else 0.0
        if score > best_score:
            best_score = score
            best_id = club["id"]

    if best_score >= 0.60:
        logger.info(
            "Club match by name '%.60s' score=%.2f → clubId=%s",
            club_name, best_score, best_id,
        )
        return best_id

    logger.debug("No confident match for club '%s' (best=%.2f)", club_name, best_score)
    return None
