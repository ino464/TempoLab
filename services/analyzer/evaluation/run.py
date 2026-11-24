"""Run a small, reproducible set of mate-in-one checks against Stockfish."""

import json
import sys
from pathlib import Path

import chess

from app.engine import analyze_position

POSITIONS_FILE = Path(__file__).with_name("positions.json")
DEPTH = 8


def mating_moves(board: chess.Board) -> list[str]:
    """Find all immediate checkmates without asking the engine."""
    result = []
    for move in list(board.legal_moves):
        board.push(move)
        if board.is_checkmate():
            result.append(move.uci())
        board.pop()
    return result


def main() -> int:
    positions = json.loads(POSITIONS_FILE.read_text(encoding="utf-8"))
    passed = 0
    for position in positions:
        board = chess.Board(position["fen"])
        expected = position["best_move"]
        if not board.is_valid() or mating_moves(board) != [expected]:
            print(f"FAIL {position['id']}: invalid position or expected move")
            continue

        result = analyze_position(position["fen"], depth=DEPTH)
        expected_mate = 1 if board.turn == chess.WHITE else -1
        line = result["principal_variation"]
        ok = (
            result["best_move"] == expected
            and bool(line)
            and line[0] == expected
            and result["evaluation"]["mate"] == expected_mate
        )
        if ok:
            passed += 1
        print(
            f"{'PASS' if ok else 'FAIL'} {position['id']}: "
            f"expected {expected}, got {result['best_move']}, "
            f"mate score {result['evaluation']['mate']}"
        )

    print(f"\n{passed}/{len(positions)} positions passed at depth {DEPTH}.")
    return 0 if positions and passed == len(positions) else 1


if __name__ == "__main__":
    sys.exit(main())
