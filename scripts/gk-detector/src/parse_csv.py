"""parse_csv.py — Load and validate the RBFA provincial CSV file."""

from __future__ import annotations

import csv
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class PlayerRecord:
    nom: str
    prenom: str
    club: Optional[str] = None
    matricule_club: Optional[str] = None   # CSV column "matricule" (club registration number)
    numaffil: Optional[str] = None         # RBFA player affiliation number (tracing only)
    date_naissance: Optional[str] = None   # Raw string from CSV (M/DD/YY)
    annee_naissance: Optional[int] = None  # Extracted 4-digit year
    province: Optional[str] = None
    cdesexe: Optional[str] = None
    # Raw row index for debugging
    row_index: int = 0


def _normalize_header(h: str) -> str:
    """Lowercase, strip, collapse spaces, remove accent on 'e'."""
    h = h.strip().lower()
    h = h.replace("é", "e").replace("è", "e").replace("ê", "e")
    h = h.replace(" ", "_")
    return h


def _parse_birth_year(raw: Optional[str]) -> Optional[int]:
    """
    Parse M/DD/YY format → 4-digit year.
    All players in this dataset are born before 2000, so YY → 19YY.
    """
    if not raw:
        return None
    raw = raw.strip()
    parts = raw.split("/")
    if len(parts) == 3:
        yy = parts[2].strip()
        if len(yy) == 2 and yy.isdigit():
            return 1900 + int(yy)
        if len(yy) == 4 and yy.isdigit():
            return int(yy)
    # fallback: try YYYY-MM-DD
    if "-" in raw and len(raw) >= 4:
        try:
            return int(raw[:4])
        except ValueError:
            pass
    return None


def _clean_numaffil(val: Optional[str]) -> Optional[str]:
    if not val:
        return None
    val = val.strip()
    if val in ("", "0", "00", "000"):
        return None
    return val


def load_players(path: str) -> list[PlayerRecord]:
    """
    Load a RBFA provincial CSV file.
    Separator: ';', encoding: Latin-1 with UTF-8 fallback.
    Returns list of PlayerRecord. Raises ValueError if required columns missing.
    """
    csv_path = Path(path)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {path}")

    # Try Latin-1 first (typical RBFA export), then UTF-8
    for encoding in ("latin-1", "utf-8-sig", "utf-8"):
        try:
            with csv_path.open(encoding=encoding, newline="") as fh:
                content = fh.read()
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ValueError(f"Could not decode {path} with latin-1 or utf-8")

    lines = content.splitlines()
    reader = csv.DictReader(lines, delimiter=";")

    # Normalize headers
    raw_headers = reader.fieldnames or []
    header_map: dict[str, str] = {_normalize_header(h): h for h in raw_headers}

    # Check required columns
    nom_key = header_map.get("nom")
    prenom_key = header_map.get("prenom")
    if not nom_key:
        raise ValueError("Column 'nom' is required in the CSV file")
    if not prenom_key:
        raise ValueError("Column 'prénom' (or 'prenom') is required in the CSV file")

    def col(row: dict, normalized_key: str) -> Optional[str]:
        original = header_map.get(normalized_key)
        if not original:
            return None
        val = row.get(original, "").strip()
        return val or None

    players: list[PlayerRecord] = []
    for i, row in enumerate(csv.DictReader(lines, delimiter=";")):
        nom = (row.get(nom_key) or "").strip()
        prenom = (row.get(prenom_key) or "").strip()
        if not nom or not prenom:
            continue  # skip blank rows

        raw_date = col(row, "datenaiss")
        players.append(PlayerRecord(
            nom=nom,
            prenom=prenom,
            club=col(row, "club"),
            matricule_club=col(row, "matricule"),
            numaffil=_clean_numaffil(col(row, "numaffil")),
            date_naissance=raw_date,
            annee_naissance=_parse_birth_year(raw_date),
            province=col(row, "province"),
            cdesexe=col(row, "cdesexe"),
            row_index=i,
        ))

    return players
