"""AppConfig — loads config.yaml into a typed dataclass."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

import yaml


@dataclass
class AppConfig:
    # Classification
    min_gk_appearances: int = 1
    min_champ_for_non_gk: int = 3
    min_match_score: float = 0.65
    ambiguous_delta: float = 0.10

    # Data collection
    max_matches_per_club: int = 50
    request_delay_seconds: float = 1.5
    request_timeout_seconds: int = 15
    cache_ttl_hours: int = 72

    # Season
    season_start: str = "2025/09/01"
    season_end: str = ""  # empty = today

    # Paths
    input_file: str = "input/players.csv"
    output_dir: str = "output/"
    cache_dir: str = "cache/"
    log_dir: str = "logs/"

    def effective_season_end(self) -> str:
        if self.season_end:
            return self.season_end
        return date.today().strftime("%Y/%m/%d")

    @classmethod
    def load(cls, path: str = "config.yaml") -> "AppConfig":
        cfg_path = Path(path)
        if not cfg_path.exists():
            return cls()
        with cfg_path.open(encoding="utf-8") as fh:
            raw = yaml.safe_load(fh) or {}
        return cls(**{k: v for k, v in raw.items() if k in cls.__dataclass_fields__})

    def ensure_dirs(self) -> None:
        for d in (self.output_dir, self.cache_dir, self.log_dir):
            Path(d).mkdir(parents=True, exist_ok=True)
