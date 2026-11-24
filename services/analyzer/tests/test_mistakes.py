import unittest
from unittest.mock import patch

from app.analysis import analyze, mistakes


class MistakesTests(unittest.TestCase):
    def test_ranks_three_largest_drops_and_preserves_tie_order(self):
        moves = [
            {"ply": 1, "centipawn": -10},
            {"ply": 2, "centipawn": -100},
            {"ply": 3, "centipawn": None},
            {"ply": 4, "centipawn": -100},
            {"ply": 5, "centipawn": 12},
            {"ply": 6, "centipawn": -30},
        ]

        self.assertEqual([move["ply"] for move in mistakes(moves)], [2, 4, 6])
        self.assertEqual(moves[0]["ply"], 1)  # Input order is unchanged.

    def test_empty_or_nonnegative_scores_return_no_mistakes(self):
        self.assertEqual(mistakes([]), [])
        self.assertEqual(mistakes([{"centipawn": None}, {"centipawn": 0}]), [])

    def test_fewer_than_three_drops_are_returned(self):
        move = {"ply": 1, "centipawn": -5}
        self.assertEqual(mistakes([move]), [move])

    def test_fools_mate_ranks_allowing_mate_but_not_delivering_it(self):
        def response(cp, mate=None):
            return {
                "evaluation": {"centipawns": cp, "mate": mate},
                "best_move": None,
                "principal_variation": [],
                "provenance": {
                    "engine_name": "Stockfish 19",
                    "requested_depth": 14,
                    "reported_depth": 14,
                    "search_duration_ms": 5.0,
                    "search_started_at": "2026-11-24T00:00:00+00:00",
                },
            }

        scores = [
            response(27),
            response(-74),
            response(-74),
            response(-68),
            response(-68),
            response(None, -1),
            response(None, -1),
            response(None, 0),
        ]
        with patch("app.analysis.analyze_position", side_effect=scores):
            results = analyze("1. f3 e5 2. g4 Qh4# 0-1")

        ranked = mistakes(results)
        self.assertEqual([move["move"] for move in ranked], ["g2g4", "f2f3", "e7e5"])
        self.assertIsNone(ranked[0]["centipawn"])

    def test_black_move_can_lose_a_forced_mate(self):
        black_to_move = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1"
        white_to_move = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 2"
        move = {
            "ply": 1,
            "centipawn": None,
            "fen_before": black_to_move,
            "fen_after": white_to_move,
            "evaluation_before": {"centipawns": None, "mate": -3},
            "evaluation_after": {"centipawns": 0, "mate": None},
        }
        self.assertEqual(mistakes([move]), [move])

    def test_improving_a_mate_score_is_not_a_mistake(self):
        fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        move = {
            "centipawn": None,
            "fen_before": fen,
            "fen_after": fen,
            "evaluation_before": {"centipawns": None, "mate": 5},
            "evaluation_after": {"centipawns": None, "mate": 3},
        }
        self.assertEqual(mistakes([move]), [])


if __name__ == "__main__":
    unittest.main()
