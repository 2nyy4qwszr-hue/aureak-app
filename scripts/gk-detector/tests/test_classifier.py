"""Tests for classifier.py — all 6 cases from AC4 table."""

import pytest
from src.classifier import classify_player, ClassificationResult
from src.config import AppConfig
from src.rbfa_match_sheets import PlayerAppearance


def _make_appearance(role: str, match_id: str = "999") -> PlayerAppearance:
    return PlayerAppearance(
        rbfa_player_id="1",
        nom="Test",
        prenom="Player",
        role=role,
        team_side="home",
        match_id=match_id,
        match_date="2025-10-01T15:00:00",
        home_team="Club A",
        away_team="Club B",
        match_url=f"https://www.rbfa.be/fr/match/{match_id}",
    )


def _gk(n: int, start: int = 1) -> list[PlayerAppearance]:
    return [_make_appearance("GK", str(100 + i)) for i in range(start, start + n)]


def _champ(n: int, start: int = 1) -> list[PlayerAppearance]:
    return [_make_appearance("joueur_champ", str(200 + i)) for i in range(start, start + n)]


CONFIG = AppConfig()  # defaults: min_gk=1, min_champ=3


class TestClassifyPlayerAC4:
    """All 6 cases from the AC4 table."""

    def test_gk_confirme_1gk_2champ(self):
        # GK confirmé: 1 GK, 2 champ → gardien, moyenne
        result = classify_player(_gk(1) + _champ(2), CONFIG, matches_fetched=3)
        assert result.statut == "gardien"
        assert result.confiance == "moyenne"
        assert result.apparitions_gk == 1
        assert result.apparitions_champ == 2

    def test_gk_recurrent_3gk_0champ(self):
        # GK récurrent: 3 GK, 0 champ → gardien, haute
        result = classify_player(_gk(3), CONFIG, matches_fetched=3)
        assert result.statut == "gardien"
        assert result.confiance == "haute"
        assert result.apparitions_gk == 3
        assert result.apparitions_champ == 0

    def test_non_gk_evident_0gk_5champ(self):
        # Non GK évident: 0 GK, 5 champ → non_gardien, haute (AC4 text: champ >= 5 → haute)
        result = classify_player(_champ(5), CONFIG, matches_fetched=5)
        assert result.statut == "non_gardien"
        assert result.confiance == "haute"
        assert result.apparitions_gk == 0
        assert result.apparitions_champ == 5

    def test_non_gk_4champ_moyenne(self):
        # 0 GK, 4 champ → non_gardien, moyenne (3-4 range = moyenne per AC4)
        result = classify_player(_champ(4), CONFIG, matches_fetched=4)
        assert result.statut == "non_gardien"
        assert result.confiance == "moyenne"

    def test_non_gk_limite_0gk_3champ(self):
        # Non GK limite: 0 GK, 3 champ → non_gardien, moyenne
        result = classify_player(_champ(3), CONFIG, matches_fetched=3)
        assert result.statut == "non_gardien"
        assert result.confiance == "moyenne"
        assert result.apparitions_gk == 0
        assert result.apparitions_champ == 3

    def test_incertain_donnees_insuffisantes(self):
        # Données insuffisantes: 0 GK, 1 champ → incertain, faible
        result = classify_player(_champ(1), CONFIG, matches_fetched=1)
        assert result.statut == "incertain"
        assert result.confiance == "faible"

    def test_incertain_aucun_match(self):
        # Aucun match trouvé: 0 GK, 0 champ → incertain, faible
        result = classify_player([], CONFIG, matches_fetched=0)
        assert result.statut == "incertain"
        assert result.confiance == "faible"
        assert result.apparitions_total == 0


class TestClassifyPlayerComments:
    def test_comment_gk_1(self):
        apps = _gk(1)
        result = classify_player(apps, CONFIG, matches_fetched=1)
        assert "GK" in result.commentaire or "gardien" in result.commentaire.lower()

    def test_comment_gk_multiple(self):
        result = classify_player(_gk(3), CONFIG, matches_fetched=5)
        assert "3" in result.commentaire

    def test_comment_non_gk(self):
        result = classify_player(_champ(4), CONFIG, matches_fetched=4)
        assert "jamais GK" in result.commentaire or "non" in result.commentaire.lower()

    def test_comment_no_data(self):
        result = classify_player([], CONFIG, matches_fetched=0)
        assert "données" in result.commentaire.lower() or "aucune" in result.commentaire.lower()


class TestClassifyPlayerCustomConfig:
    def test_higher_min_gk(self):
        config = AppConfig(min_gk_appearances=2)
        # 1 GK → not enough → incertain
        result = classify_player(_gk(1), config, matches_fetched=1)
        assert result.statut == "incertain"

    def test_higher_min_champ(self):
        config = AppConfig(min_champ_for_non_gk=5)
        # 3 champ → not enough → incertain
        result = classify_player(_champ(3), config, matches_fetched=3)
        assert result.statut == "incertain"

    def test_sources_urls_populated(self):
        apps = _gk(2)
        result = classify_player(apps, CONFIG, matches_fetched=2)
        assert len(result.sources_urls) == 2
