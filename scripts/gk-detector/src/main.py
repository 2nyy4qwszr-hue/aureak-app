"""main.py — CLI orchestrator for GK detection script."""

from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

# Allow running from the scripts/gk-detector directory
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.classifier import ClassificationResult, classify_no_club, classify_player
from src.config import AppConfig
from src.export import ResultRow, export_results, load_partial, save_partial
from src.normalize import compute_lineup_match_score
from src.parse_csv import PlayerRecord, load_players
from src.rbfa_client import RbfaClient
from src.rbfa_match_sheets import PlayerAppearance, get_all_appearances_for_club
from src.rbfa_search import search_club_rbfa_id

try:
    from rich.console import Console
    from rich.logging import RichHandler
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, MofNCompleteColumn
    RICH = True
except ImportError:
    RICH = False


def setup_logging(log_dir: str, verbose: bool = False) -> None:
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_path = Path(log_dir) / f"run_{ts}.log"

    handlers: list[logging.Handler] = [logging.FileHandler(log_path, encoding="utf-8")]
    if RICH:
        handlers.append(RichHandler(show_path=False))
    else:
        handlers.append(logging.StreamHandler())

    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=level, handlers=handlers,
                        format="%(asctime)s %(levelname)s %(message)s")


def find_player_in_appearances(
    player: PlayerRecord,
    appearances: list[PlayerAppearance],
    min_score: float,
    ambiguous_delta: float,
) -> tuple[list[PlayerAppearance], float, str]:
    """
    Find appearances matching a CSV player by fuzzy name.

    Returns (matched_appearances, best_score, ambiguity_note).
    """
    if not appearances:
        return [], 0.0, ""

    # Score every unique RBFA player ID
    player_scores: dict[str, float] = {}
    player_info: dict[str, tuple[str, str]] = {}  # id → (nom, prenom)

    for app in appearances:
        pid = app.rbfa_player_id
        if pid not in player_scores:
            score = compute_lineup_match_score(
                player_nom=player.nom,
                player_prenom=player.prenom,
                candidate_last=app.nom,
                candidate_first=app.prenom,
            )
            player_scores[pid] = score
            player_info[pid] = (app.nom, app.prenom)

    if not player_scores:
        return [], 0.0, ""

    sorted_ids = sorted(player_scores, key=lambda k: -player_scores[k])
    best_id = sorted_ids[0]
    best_score = player_scores[best_id]

    if best_score < min_score:
        return [], best_score, f"matching insuffisant (score {best_score:.2f})"

    # Check for ambiguity
    if len(sorted_ids) >= 2:
        second_score = player_scores[sorted_ids[1]]
        if best_score - second_score < ambiguous_delta:
            cand1 = player_info[best_id]
            cand2 = player_info[sorted_ids[1]]
            note = (
                f"plusieurs profils possibles, validation manuelle nécessaire "
                f"({cand1[0]} {cand1[1]} vs {cand2[0]} {cand2[1]})"
            )
            return [], best_score, note

    matched = [a for a in appearances if a.rbfa_player_id == best_id]
    return matched, best_score, ""


def process_player(
    player: PlayerRecord,
    club_appearances_cache: dict[str, list[PlayerAppearance]],
    club_matches_count: dict[str, int],
    config: AppConfig,
) -> tuple[ClassificationResult, float]:
    """
    Find a player's appearances in pre-fetched club appearances and classify them.
    Returns (ClassificationResult, match_score).
    """
    club_key = _club_key(player)
    appearances = club_appearances_cache.get(club_key, [])
    matches_count = club_matches_count.get(club_key, 0)

    matched_apps, score, ambiguity_note = find_player_in_appearances(
        player=player,
        appearances=appearances,
        min_score=config.min_match_score,
        ambiguous_delta=config.ambiguous_delta,
    )

    if ambiguity_note:
        result = ClassificationResult(
            statut="incertain",
            confiance="faible",
            commentaire=ambiguity_note,
            apparitions_gk=0,
            apparitions_champ=0,
            apparitions_total=0,
            matches_trouves=matches_count,
            sources_urls=[],
        )
        return result, score

    result = classify_player(matched_apps, config, matches_fetched=matches_count)
    return result, score


def _club_key(player: PlayerRecord) -> str:
    return f"{player.matricule_club or ''}::{player.club or ''}"


def build_club_appearances_cache(
    players: list[PlayerRecord],
    config: AppConfig,
    client: RbfaClient,
) -> tuple[dict[str, list[PlayerAppearance]], dict[str, int]]:
    """
    For each unique club in the player list, fetch all matches and appearances.
    Returns (appearances_by_club_key, match_count_by_club_key).
    """
    # Group players by club
    clubs_seen: dict[str, tuple[Optional[str], Optional[str]]] = {}
    for p in players:
        key = _club_key(p)
        if key not in clubs_seen:
            clubs_seen[key] = (p.matricule_club, p.club)

    appearances_cache: dict[str, list[PlayerAppearance]] = {}
    matches_count: dict[str, int] = {}

    total_clubs = len(clubs_seen)
    logging.info("Resolving %d unique clubs via RBFA API...", total_clubs)

    for i, (key, (matricule, club_name)) in enumerate(clubs_seen.items(), 1):
        logging.info("[%d/%d] Club: %s (matricule=%s)", i, total_clubs, club_name, matricule)

        if not club_name and not matricule:
            appearances_cache[key] = []
            matches_count[key] = 0
            continue

        club_rbfa_id = search_club_rbfa_id(club_name or "", matricule, client)
        if not club_rbfa_id:
            logging.warning("  → Could not resolve RBFA ID for club '%s'", club_name)
            appearances_cache[key] = []
            matches_count[key] = 0
            continue

        logging.info("  → RBFA clubId: %s", club_rbfa_id)
        match_refs, all_apps = get_all_appearances_for_club(club_rbfa_id, config, client)
        appearances_cache[key] = all_apps
        matches_count[key] = len(match_refs)
        logging.info("  → %d finished matches, %d appearances", len(match_refs), len(all_apps))

    return appearances_cache, matches_count


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="GK Detector — Identify goalkeepers via RBFA match sheet crossing"
    )
    parser.add_argument("--config", default="config.yaml", help="Path to config.yaml")
    parser.add_argument("--input", help="Override input CSV path")

    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true",
                      help="Analyse first 3 players only, no output written")
    mode.add_argument("--test", type=int, metavar="N",
                      help="Analyse first N players")
    mode.add_argument("--full", action="store_true",
                      help="Full analysis (default)")
    mode.add_argument("--resume", metavar="PARTIAL_CSV",
                      help="Resume from a partial output file")

    parser.add_argument("--clear-cache", action="store_true",
                        help="Clear all cached API responses before running")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Enable debug logging")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = AppConfig.load(args.config)
    config.ensure_dirs()

    setup_logging(config.log_dir, verbose=args.verbose)
    logger = logging.getLogger(__name__)

    if args.input:
        config.input_file = args.input

    client = RbfaClient(config)

    if args.clear_cache:
        n = client.clear_cache()
        print(f"Cache cleared: {n} files deleted.")

    # Load players
    logger.info("Loading players from %s", config.input_file)
    try:
        all_players = load_players(config.input_file)
    except (FileNotFoundError, ValueError) as e:
        logger.error("Failed to load players: %s", e)
        sys.exit(1)

    logger.info("Loaded %d players", len(all_players))

    # Apply mode limits
    skip_set: set[tuple[str, str]] = set()
    if args.resume:
        skip_set = load_partial(args.resume)

    if args.dry_run:
        players = all_players[:3]
        logger.info("Dry-run mode: analysing first 3 players")
    elif args.test is not None:
        players = all_players[:args.test]
        logger.info("Test mode: analysing first %d players", args.test)
    else:
        players = all_players
        logger.info("Full mode: analysing all %d players", len(players))

    # Filter out already-processed players (resume mode)
    if skip_set:
        before = len(players)
        players = [
            p for p in players
            if (p.nom.upper(), p.prenom.upper()) not in skip_set
        ]
        logger.info("Resume: skipped %d already-processed players", before - len(players))

    # Build club appearances cache (bulk API calls per club)
    appearances_cache, matches_count = build_club_appearances_cache(players, config, client)

    # Process each player
    results: list[ResultRow] = []
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    save_every = 20

    logger.info("Classifying %d players...", len(players))

    for i, player in enumerate(players, 1):
        club_key = _club_key(player)

        if club_key not in appearances_cache:
            classification = classify_no_club("club RBFA introuvable")
            score = 0.0
        else:
            classification, score = process_player(
                player, appearances_cache, matches_count, config
            )

        row = ResultRow(
            prenom=player.prenom,
            nom=player.nom,
            club=player.club or "",
            numaffil=player.numaffil or "",
            matches_trouves=classification.matches_trouves,
            apparitions_total=classification.apparitions_total,
            apparitions_GK=classification.apparitions_gk,
            apparitions_champ=classification.apparitions_champ,
            statut_final=classification.statut,
            confiance=classification.confiance,
            commentaire=classification.commentaire,
            rbfa_profil_url="",
            sources_urls=";".join(classification.sources_urls),
            score_matching=score,
        )
        results.append(row)

        logger.info(
            "[%d/%d] %s %s → %s (%s) score=%.2f",
            i, len(players),
            player.prenom, player.nom,
            classification.statut, classification.confiance, score,
        )

        # Partial save every N rows
        if not args.dry_run and i % save_every == 0:
            save_partial(results, config.output_dir, timestamp)
            logger.info("Partial save: %d rows", len(results))

    # Final export
    if not args.dry_run:
        output_path = Path(config.output_dir) / f"results_{timestamp}.csv"
        export_results(results, str(output_path))
    else:
        logger.info("Dry-run: skipping output file write")

    # Summary
    gardiens = sum(1 for r in results if r.statut_final == "gardien")
    non_gk = sum(1 for r in results if r.statut_final == "non_gardien")
    incertains = sum(1 for r in results if r.statut_final == "incertain")

    print(f"\n{'='*50}")
    print(f"  Résultats — {len(results)} joueurs analysés")
    print(f"{'='*50}")
    print(f"  Gardiens      : {gardiens}")
    print(f"  Non-gardiens  : {non_gk}")
    print(f"  Incertains    : {incertains}")
    if not args.dry_run:
        print(f"  Fichier       : {output_path}")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
