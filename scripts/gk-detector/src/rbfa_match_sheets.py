"""rbfa_match_sheets.py — Fetch club matches and extract player lineups from match sheets."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional

from src.config import AppConfig
from src.rbfa_client import RbfaClient

logger = logging.getLogger(__name__)

# APQ hashes (discovered via Chrome DevTools interception — 2026-03-20)
APQ_CLUB_MATCHES = "eeeb92967d0b593c29f321f717ab2d81179bad5e1efce80a963a7d1ef4fabb41"
APQ_MATCH_DETAIL = "cd8867b845c206fe7aa75c1ebf7b53cbda0ff030253a45e2e2b4bcc13ee46c9a"

MATCH_URL_TEMPLATE = "https://www.rbfa.be/fr/match/{match_id}"


@dataclass
class MatchRef:
    match_id: str
    date: str          # ISO datetime string "2025-09-03T18:30:00"
    home_team: str
    away_team: str
    home_club_id: str
    away_club_id: str
    age_group: str
    state: str
    url: str = field(default="")

    def __post_init__(self) -> None:
        if not self.url:
            self.url = MATCH_URL_TEMPLATE.format(match_id=self.match_id)


@dataclass
class PlayerAppearance:
    rbfa_player_id: str
    nom: str
    prenom: str
    role: str          # "GK" or "joueur_champ"
    team_side: str     # "home" or "away"
    match_id: str
    match_date: str
    home_team: str
    away_team: str
    match_url: str


def get_club_matches(
    club_rbfa_id: str,
    start_date: str,   # "YYYY/MM/DD"
    end_date: str,     # "YYYY/MM/DD"
    client: RbfaClient,
    max_matches: int = 50,
) -> list[MatchRef]:
    """
    Fetch all finished matches for a club using clubMatchesAssignations APQ.
    Returns only finished matches (lineup data available).
    """
    body = {
        "operationName": "clubMatchesAssignations",
        "variables": {
            "clubId": club_rbfa_id,
            "language": "fr",
            "startDate": start_date,
            "endDate": end_date,
            "hasLocation": True,
        },
        "extensions": {
            "persistedQuery": {"version": 1, "sha256Hash": APQ_CLUB_MATCHES},
        },
    }
    try:
        data = client.post_graphql(body)
    except Exception as e:
        logger.error("clubMatchesAssignations failed for clubId=%s: %s", club_rbfa_id, e)
        return []

    raw_matches = data.get("data", {}).get("clubMatchesAssignations") or []
    finished = [m for m in raw_matches if m.get("state") == "finished"]

    refs: list[MatchRef] = []
    for m in finished[:max_matches]:
        refs.append(MatchRef(
            match_id=m["id"],
            date=m.get("startTime", ""),
            home_team=m.get("homeTeam", {}).get("name", ""),
            away_team=m.get("awayTeam", {}).get("name", ""),
            home_club_id=m.get("homeTeam", {}).get("clubId", ""),
            away_club_id=m.get("awayTeam", {}).get("clubId", ""),
            age_group=m.get("ageGroup", ""),
            state=m["state"],
        ))

    logger.info(
        "Club %s: %d total matches, %d finished",
        club_rbfa_id, len(raw_matches), len(refs),
    )
    return refs


def fetch_match_sheet(match_ref: MatchRef, client: RbfaClient) -> list[PlayerAppearance]:
    """
    Fetch the match detail and extract all player appearances with role.
    Role is determined by the 'badges' field: "(GK)" in badges → GK.
    """
    body = {
        "operationName": "GetMatchDetail",
        "variables": {
            "matchId": match_ref.match_id,
            "language": "fr",
        },
        "extensions": {
            "persistedQuery": {"version": 1, "sha256Hash": APQ_MATCH_DETAIL},
        },
    }
    try:
        data = client.post_graphql(body)
    except Exception as e:
        logger.error("GetMatchDetail failed for matchId=%s: %s", match_ref.match_id, e)
        return []

    detail = data.get("data", {}).get("matchDetail", {})
    lineup = detail.get("lineup") or []

    if not lineup:
        return []

    substitutes = detail.get("substitutes") or []

    def _extract_appearances(entries: list) -> list[PlayerAppearance]:
        result = []
        for entry in entries:
            for side in ("home", "away"):
                player = entry.get(side)
                if not player or not player.get("id"):
                    continue
                badges = player.get("badges", "") or ""
                role = "GK" if "(GK)" in badges else "joueur_champ"
                result.append(PlayerAppearance(
                    rbfa_player_id=player["id"],
                    nom=player.get("lastName", ""),
                    prenom=player.get("firstName", ""),
                    role=role,
                    team_side=side,
                    match_id=match_ref.match_id,
                    match_date=match_ref.date,
                    home_team=match_ref.home_team,
                    away_team=match_ref.away_team,
                    match_url=match_ref.url,
                ))
        return result

    appearances: list[PlayerAppearance] = []
    appearances.extend(_extract_appearances(lineup))
    appearances.extend(_extract_appearances(substitutes))

    return appearances


def get_all_appearances_for_club(
    club_rbfa_id: str,
    config: AppConfig,
    client: RbfaClient,
) -> tuple[list[MatchRef], list[PlayerAppearance]]:
    """
    Get all finished matches + all player appearances for a club.
    Returns (match_refs, all_appearances).
    """
    matches = get_club_matches(
        club_rbfa_id=club_rbfa_id,
        start_date=config.season_start,
        end_date=config.effective_season_end(),
        client=client,
        max_matches=config.max_matches_per_club,
    )
    all_appearances: list[PlayerAppearance] = []
    for match_ref in matches:
        sheet = fetch_match_sheet(match_ref, client)
        all_appearances.extend(sheet)

    logger.info(
        "Club %s: %d matches fetched, %d player appearances total",
        club_rbfa_id, len(matches), len(all_appearances),
    )
    return matches, all_appearances
