"""export.py — Export results to CSV."""

from __future__ import annotations

import csv
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

FIELDNAMES = [
    "prenom",
    "nom",
    "club",
    "numaffil",
    "matches_trouves",
    "apparitions_total",
    "apparitions_GK",
    "apparitions_champ",
    "statut_final",
    "confiance",
    "commentaire",
    "rbfa_profil_url",
    "sources_urls",
    "score_matching",
]


@dataclass
class ResultRow:
    prenom: str
    nom: str
    club: str
    numaffil: str = ""
    matches_trouves: int = 0
    apparitions_total: int = 0
    apparitions_GK: int = 0
    apparitions_champ: int = 0
    statut_final: str = "incertain"
    confiance: str = "faible"
    commentaire: str = ""
    rbfa_profil_url: str = ""
    sources_urls: str = ""      # semicolon-joined URLs
    score_matching: float = 0.0


def export_results(results: list[ResultRow], output_path: str) -> None:
    """Write results to CSV. Creates parent directory if needed."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDNAMES, delimiter=";")
        writer.writeheader()
        for row in results:
            writer.writerow({
                "prenom": row.prenom,
                "nom": row.nom,
                "club": row.club,
                "numaffil": row.numaffil,
                "matches_trouves": row.matches_trouves,
                "apparitions_total": row.apparitions_total,
                "apparitions_GK": row.apparitions_GK,
                "apparitions_champ": row.apparitions_champ,
                "statut_final": row.statut_final,
                "confiance": row.confiance,
                "commentaire": row.commentaire,
                "rbfa_profil_url": row.rbfa_profil_url,
                "sources_urls": row.sources_urls,
                "score_matching": f"{row.score_matching:.3f}",
            })

    logger.info("Results written to %s (%d rows)", output_path, len(results))


def save_partial(results: list[ResultRow], output_dir: str, timestamp: str) -> str:
    """Save partial results. Returns path written."""
    path = Path(output_dir) / f"partial_{timestamp}.csv"
    export_results(results, str(path))
    return str(path)


def load_partial(path: str) -> set[tuple[str, str]]:
    """
    Load already-processed players from a partial CSV.
    Returns set of (nom, prenom) tuples.
    """
    done: set[tuple[str, str]] = set()
    partial = Path(path)
    if not partial.exists():
        return done
    with partial.open(encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            nom = row.get("nom", "").strip()
            prenom = row.get("prenom", "").strip()
            if nom and prenom:
                done.add((nom.upper(), prenom.upper()))
    logger.info("Resume: %d players already processed from %s", len(done), path)
    return done
