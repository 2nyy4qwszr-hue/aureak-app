"""normalize.py — Name normalization and match scoring utilities."""

from __future__ import annotations

import re
from typing import Optional

from unidecode import unidecode


def normalize_name(s: str) -> str:
    """
    Normalize a name for comparison:
    - unidecode (remove accents)
    - lowercase
    - strip leading/trailing whitespace
    - collapse multiple spaces/hyphens to single space
    """
    if not s:
        return ""
    s = unidecode(s)
    s = s.lower().strip()
    s = re.sub(r"[-_]+", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s


def extract_birth_year(date_str: Optional[str]) -> Optional[int]:
    """
    Extract a 4-digit birth year from various string formats:
    - M/DD/YY  (RBFA CSV) → 19YY  (all players born before 2000)
    - DD/MM/YYYY
    - YYYY-MM-DD
    - YYYY alone
    Returns None if cannot parse.
    """
    if not date_str:
        return None
    s = date_str.strip()

    # YYYY-MM-DD or YYYY/MM/DD with 4-digit year first
    m = re.match(r"^(\d{4})[-/]", s)
    if m:
        return int(m.group(1))

    # M/DD/YY or DD/MM/YY or DD/MM/YYYY
    parts = re.split(r"[/\-]", s)
    if len(parts) == 3:
        a, b, c = parts[0].strip(), parts[1].strip(), parts[2].strip()
        if len(c) == 4 and c.isdigit():
            return int(c)
        if len(c) == 2 and c.isdigit():
            # Assume 19XX (all players in dataset born before 2000)
            return 1900 + int(c)

    # Just 4 digits
    if re.match(r"^\d{4}$", s):
        return int(s)

    return None


def _fuzzy_ratio(a: str, b: str) -> float:
    """Simple character-level fuzzy ratio using fuzzywuzzy if available."""
    try:
        from fuzzywuzzy import fuzz
        return fuzz.token_set_ratio(a, b) / 100.0
    except ImportError:
        # Fallback: exact match only
        return 1.0 if a == b else 0.0


def compute_lineup_match_score(
    player_nom: str,
    player_prenom: str,
    candidate_last: str,
    candidate_first: str,
) -> float:
    """
    Compute similarity score between a CSV player and a lineup player.
    Returns float 0.0 – 1.0.

    Weights:
      nom    0.50
      prenom 0.50

    Note: club matching is not applicable (already filtered by club when fetching
    matches). Birth year is not present in lineup data.
    """
    pn = normalize_name(player_nom)
    pp = normalize_name(player_prenom)
    cn = normalize_name(candidate_last)
    cp = normalize_name(candidate_first)

    # Weights: nom 0.50, prenom 0.50 — birth year is not present in lineup data
    score = 0.50 * _fuzzy_ratio(pn, cn) + 0.50 * _fuzzy_ratio(pp, cp)

    return round(score, 3)


def compute_match_score_full(
    nom: str,
    prenom: str,
    club: Optional[str],
    annee: Optional[int],
    candidate_nom: str,
    candidate_prenom: str,
    candidate_club: Optional[str] = None,
    candidate_annee: Optional[int] = None,
) -> float:
    """
    Full AC5 scoring for general matching (search results, not lineup).
    """
    weights: dict[str, float] = {}
    if nom:
        weights["nom"] = 0.35
    if prenom:
        weights["prenom"] = 0.30
    if annee:
        weights["annee"] = 0.20
    if club:
        weights["club"] = 0.10

    if not weights:
        return 0.0

    total_w = sum(weights.values())
    weights = {k: v / total_w for k, v in weights.items()}

    score = 0.0
    if "nom" in weights:
        score += weights["nom"] * _fuzzy_ratio(normalize_name(nom), normalize_name(candidate_nom))
    if "prenom" in weights:
        score += weights["prenom"] * _fuzzy_ratio(normalize_name(prenom), normalize_name(candidate_prenom))
    if "annee" in weights and annee and candidate_annee:
        score += weights["annee"] * (1.0 if annee == candidate_annee else 0.0)
    if "club" in weights:
        cn1 = normalize_name(club or "")
        cn2 = normalize_name(candidate_club or "")
        score += weights["club"] * _fuzzy_ratio(cn1, cn2)

    return round(score, 3)
