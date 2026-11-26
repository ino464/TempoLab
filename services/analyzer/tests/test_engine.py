import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import chess
import chess.engine

from app.engine import analyze_position


class EngineProvenanceTests(unittest.TestCase):
    def test_records_actual_search_details_and_closes_engine(self):
        engine = MagicMock()
        engine.id = {"name": "Stockfish test version"}
        engine.analyse.return_value = {
            "score": chess.engine.PovScore(chess.engine.Cp(25), chess.WHITE),
            "pv": [chess.Move.from_uci("e2e4")],
            "depth": 7,
        }
        with (
            patch("app.engine.STOCKFISH_PATH") as path,
            patch(
                "app.engine.chess.engine.SimpleEngine.popen_uci", return_value=engine
            ),
            patch("app.engine.perf_counter", side_effect=[10.0, 10.125]),
        ):
            path.is_file.return_value = True
            result = analyze_position(chess.STARTING_FEN, depth=8)

        provenance = result["provenance"]
        self.assertEqual(provenance["engine_name"], "Stockfish test version")
        self.assertEqual(provenance["requested_depth"], 8)
        self.assertEqual(provenance["reported_depth"], 7)
        self.assertEqual(provenance["search_duration_ms"], 125.0)
        self.assertEqual(
            datetime.fromisoformat(provenance["search_started_at"]).utcoffset(),
            timedelta(0),
        )
        engine.quit.assert_called_once()

    def test_missing_reported_depth_is_not_assumed(self):
        engine = MagicMock()
        engine.id = {"name": "Stockfish"}
        engine.analyse.return_value = {
            "score": chess.engine.PovScore(chess.engine.Cp(0), chess.WHITE),
        }
        with (
            patch("app.engine.STOCKFISH_PATH") as path,
            patch(
                "app.engine.chess.engine.SimpleEngine.popen_uci", return_value=engine
            ),
        ):
            path.is_file.return_value = True
            result = analyze_position(chess.STARTING_FEN, depth=8)
        self.assertIsNone(result["provenance"]["reported_depth"])


if __name__ == "__main__":
    unittest.main()
