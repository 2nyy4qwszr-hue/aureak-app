"""classifier.py — GK classification logic (AC4)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from src.config import AppConfig
from src.rbfa_match_sheets import PlayerAppearance


@dataclass
class ClassificationResult:
    statut: str           # "gardien" | "non_gardien" | "incertain"
    confiance: str        # "haute" | "moyenne" | "faible"
    commentaire: str
    apparitions_gk: int
    apparitions_champ: int
    apparitions_total: int
    matches_trouves: int
    sources_urls: list[str] = field(default_factory=list)


def _build_comment(
    statut: str,
    gk: int,
    champ: int,
    total: int,
    matches: int,
    appearances: list[PlayerAppearance],
) -> str:
    if statut == "gardien":
        if gk == 1:
            # Try to get match detail for the comment
            if appearances:
                a = next((a for a in appearances if a.role == "GK"), None)
                if a:
                    date_str = a.match_date[:10] if a.match_date else "date inconnue"
                    vs = f"{a.home_team} – {a.away_team}"
                    return f"1 apparition GK détectée (match du {date_str} — {vs})"
            return "1 apparition GK détectée"
        return f"{gk} apparitions GK sur {matches} matchs analysés"

    if statut == "non_gardien":
        return f"{total} apparition(s) trouvée(s), jamais GK"

    # incertain
    if matches == 0:
        return "aucune donnée RBFA exploitable"
    if total == 0:
        return f"joueur non trouvé dans les {matches} feuilles de match analysées"
    return f"données insuffisantes ({total} apparition(s), {gk} GK)"


def classify_player(
    appearances: list[PlayerAppearance],
    config: AppConfig,
    matches_fetched: int = 0,
) -> ClassificationResult:
    """
    Apply AC4 classification logic.

    gardien    : apparitions_GK >= min_gk_appearances
    non_gardien: apparitions_GK == 0 AND apparitions_champ >= min_champ_for_non_gk
    incertain  : otherwise
    """
    gk_apps = [a for a in appearances if a.role == "GK"]
    champ_apps = [a for a in appearances if a.role == "joueur_champ"]
    gk = len(gk_apps)
    champ = len(champ_apps)
    total = gk + champ
    sources = list(dict.fromkeys(a.match_url for a in appearances))

    if gk >= config.min_gk_appearances:
        statut = "gardien"
        if gk >= 2:
            confiance = "haute"
        else:
            confiance = "moyenne"

    elif gk == 0 and champ >= config.min_champ_for_non_gk:
        statut = "non_gardien"
        if champ >= 5:
            confiance = "haute"
        else:
            confiance = "moyenne"

    else:
        statut = "incertain"
        confiance = "faible"

    commentaire = _build_comment(statut, gk, champ, total, matches_fetched, appearances)

    return ClassificationResult(
        statut=statut,
        confiance=confiance,
        commentaire=commentaire,
        apparitions_gk=gk,
        apparitions_champ=champ,
        apparitions_total=total,
        matches_trouves=matches_fetched,
        sources_urls=sources,
    )


def classify_no_club(reason: str = "club RBFA introuvable") -> ClassificationResult:
    """Return incertain result when club cannot be resolved."""
    return ClassificationResult(
        statut="incertain",
        confiance="faible",
        commentaire=reason,
        apparitions_gk=0,
        apparitions_champ=0,
        apparitions_total=0,
        matches_trouves=0,
        sources_urls=[],
    )
