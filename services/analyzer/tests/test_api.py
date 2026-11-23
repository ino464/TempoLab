import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app


class AnalysisAPITests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, raise_server_exceptions=False)

    def test_invalid_games_return_400_without_starting_engine(self):
        examples = (
            ("", "empty game"),
            ("1. e4 e5 2. Bh6 *", "PGN contains parsing error"),
            ('[Event "Test"]\n\n*', "Game contains no moves."),
        )
        with patch("app.analysis.analyze_position") as engine:
            for pgn, expected in examples:
                with self.subTest(pgn=pgn):
                    response = self.client.post("/api/v1/analyze", json={"pgn": pgn})
                    self.assertEqual(response.status_code, 400)
                    self.assertEqual(response.json(), {"detail": expected})
            engine.assert_not_called()

    def test_valid_game_returns_named_lists(self):
        def score(cp):
            return {
                "evaluation": {"centipawns": cp, "mate": None},
                "best_move": None,
                "principal_variation": [],
            }

        with patch(
            "app.analysis.analyze_position", side_effect=[score(20), score(-30)]
        ):
            response = self.client.post("/api/v1/analyze", json={"pgn": "1. f3 *"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["analysis"][0]["move"], "f2f3")
        self.assertEqual(response.json()["critical_positions"][0]["centipawn"], -50)

    def test_other_value_errors_are_not_reported_as_invalid_pgn(self):
        with patch(
            "app.analysis.analyze_position", side_effect=ValueError("engine error")
        ):
            response = self.client.post("/api/v1/analyze", json={"pgn": "1. e4 *"})
        self.assertEqual(response.status_code, 500)

    def test_missing_pgn_is_rejected_by_request_model(self):
        response = self.client.post("/api/v1/analyze", json={})
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
