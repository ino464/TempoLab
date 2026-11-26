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
                "provenance": {
                    "engine_name": "Stockfish 19",
                    "requested_depth": 14,
                    "reported_depth": 12,
                    "search_duration_ms": 25.5,
                    "search_started_at": "2026-11-24T00:00:00+00:00",
                },
            }

        with patch(
            "app.analysis.analyze_position", side_effect=[score(20), score(-30)]
        ):
            response = self.client.post("/api/v1/analyze", json={"pgn": "1. f3 *"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["analysis"][0]["move"], "f2f3")
        self.assertEqual(response.json()["critical_positions"][0]["centipawn"], -50)
        move = response.json()["analysis"][0]
        self.assertEqual(move["provenance_before"]["engine_name"], "Stockfish 19")
        self.assertEqual(move["provenance_after"]["requested_depth"], 14)
        self.assertEqual(move["provenance_after"]["reported_depth"], 12)
        self.assertEqual(move["provenance_after"]["search_duration_ms"], 25.5)
        self.assertIn("2026-11-24", move["provenance_before"]["search_started_at"])

    def test_other_value_errors_are_not_reported_as_invalid_pgn(self):
        with patch(
            "app.analysis.analyze_position", side_effect=ValueError("engine error")
        ):
            response = self.client.post("/api/v1/analyze", json={"pgn": "1. e4 *"})
        self.assertEqual(response.status_code, 500)

    def test_missing_pgn_is_rejected_by_request_model(self):
        response = self.client.post("/api/v1/analyze", json={})
        self.assertEqual(response.status_code, 422)

    def test_frontend_can_preflight_json_analysis_request(self):
        response = self.client.options(
            "/api/v1/analyze",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["access-control-allow-origin"], "http://localhost:3000"
        )

    def test_other_origins_cannot_preflight(self):
        response = self.client.options(
            "/api/v1/analyze",
            headers={
                "Origin": "https://example.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_openapi_documents_the_nested_response(self):
        schema = self.client.get("/openapi.json").json()
        response_schema = schema["paths"]["/api/v1/analyze"]["post"]["responses"][
            "200"
        ]["content"]["application/json"]["schema"]
        self.assertEqual(
            response_schema["$ref"], "#/components/schemas/AnalysisResponse"
        )
        models = schema["components"]["schemas"]
        self.assertEqual(
            set(models["AnalysisResponse"]["required"]),
            {"analysis", "critical_positions"},
        )
        self.assertIn("evaluation_before", models["MoveAnalysis"]["properties"])
        self.assertIn("mate", models["EngineEvaluation"]["properties"])
        self.assertIn("provenance_before", models["MoveAnalysis"]["properties"])
        self.assertIn("reported_depth", models["EngineProvenance"]["properties"])

    def test_invalid_analysis_output_is_a_server_error(self):
        with (
            patch("app.main.analyze", return_value=[{"centipawn": -10}]),
            patch("app.main.mistakes", return_value=[]),
        ):
            response = self.client.post("/api/v1/analyze", json={"pgn": "1. e4 *"})
        self.assertEqual(response.status_code, 500)


if __name__ == "__main__":
    unittest.main()
