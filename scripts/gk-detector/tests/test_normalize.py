"""Tests for normalize.py — normalisation and scoring utilities."""

import pytest
from src.normalize import normalize_name, extract_birth_year, compute_lineup_match_score


class TestNormalizeName:
    def test_uppercase_to_lower(self):
        assert normalize_name("DUPONT") == "dupont"

    def test_removes_accents(self):
        assert normalize_name("Léa") == "lea"
        assert normalize_name("Théo") == "theo"
        assert normalize_name("Ève") == "eve"

    def test_collapses_hyphens(self):
        assert normalize_name("Jean-Claude") == "jean claude"

    def test_collapses_multiple_spaces(self):
        assert normalize_name("Jean   Pierre") == "jean pierre"

    def test_strips_whitespace(self):
        assert normalize_name("  dupont  ") == "dupont"

    def test_empty_string(self):
        assert normalize_name("") == ""

    def test_mixed_case_accent(self):
        assert normalize_name("DÉSIRÉ") == "desire"

    def test_double_hyphen(self):
        assert normalize_name("Ben--Ahmed") == "ben ahmed"


class TestExtractBirthYear:
    def test_m_dd_yy_format(self):
        assert extract_birth_year("8/11/94") == 1994
        assert extract_birth_year("12/03/85") == 1985
        assert extract_birth_year("1/1/00") == 1900  # edge case

    def test_yyyy_mm_dd_format(self):
        assert extract_birth_year("1994-08-11") == 1994
        assert extract_birth_year("1985/12/03") == 1985

    def test_dd_mm_yyyy_format(self):
        assert extract_birth_year("11/08/1994") == 1994
        assert extract_birth_year("03/12/1985") == 1985

    def test_four_digit_year(self):
        assert extract_birth_year("1994") == 1994

    def test_none_input(self):
        assert extract_birth_year(None) is None

    def test_empty_string(self):
        assert extract_birth_year("") is None

    def test_invalid_format(self):
        assert extract_birth_year("invalid") is None


class TestComputeLineupMatchScore:
    def test_exact_match(self):
        score = compute_lineup_match_score("DUPONT", "JEAN", "Dupont", "Jean")
        assert score > 0.90

    def test_different_person(self):
        score = compute_lineup_match_score("DUPONT", "JEAN", "Martin", "Paul")
        assert score < 0.30

    def test_accent_insensitive(self):
        score = compute_lineup_match_score("LEFÈVRE", "THÉO", "Lefevre", "Theo")
        assert score > 0.90

    def test_partial_name_match(self):
        # Last name matches, first name different
        score = compute_lineup_match_score("DUPONT", "JEAN", "Dupont", "Pierre")
        assert 0.30 < score < 0.70

    def test_uppercase_csv_normalized(self):
        # CSV names are ALL CAPS
        score = compute_lineup_match_score("BEAUJEAN", "MATHIS", "Beaujean", "Mathis")
        assert score > 0.90
