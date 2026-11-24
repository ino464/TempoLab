import json
import unittest

import chess

from evaluation.run import POSITIONS_FILE, mating_moves


class EvaluationSuiteTests(unittest.TestCase):
    def test_positions_have_unique_valid_mate_in_one(self):
        positions = json.loads(POSITIONS_FILE.read_text(encoding="utf-8"))
        self.assertEqual(len(positions), 10)
        self.assertEqual(len({position["id"] for position in positions}), 10)
        turns = []
        for position in positions:
            with self.subTest(position=position["id"]):
                board = chess.Board(position["fen"])
                self.assertTrue(board.is_valid())
                self.assertEqual(mating_moves(board), [position["best_move"]])
                turns.append(board.turn)
        self.assertEqual(turns.count(chess.WHITE), 5)
        self.assertEqual(turns.count(chess.BLACK), 5)


if __name__ == "__main__":
    unittest.main()
