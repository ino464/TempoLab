from pathlib import Path

import chess
import chess.engine

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
STOCKFISH_PATH = (
    REPOSITORY_ROOT / "tools" / "stockfish" / "stockfish-windows-x86-64-universal.exe"
)


def analyze_position(fen: str, depth: int = 14) -> dict[str, object]:
    if depth < 1:
        raise ValueError("Analysis Depth must be atleast 1.")

    if not STOCKFISH_PATH.is_file():
        raise FileNotFoundError("Stockfish executable not found")

    try:
        board = chess.Board(fen)
    except ValueError as error:
        raise ValueError(f"Invalid FEN string: {error}")
    if not board.is_valid():
        raise ValueError("Invalid FEN string: The position is not valid.")

    engine = chess.engine.SimpleEngine.popen_uci(str(STOCKFISH_PATH))

    try:
        info = engine.analyse(board, chess.engine.Limit(depth=depth))
        engine_name = engine.id.get("name", "Stockfish")
    finally:
        engine.quit()

    score = info["score"].white()
    principal_variation = info.get("pv", [])

    return {
        "fen": board.fen(),
        "evaluation": {
            "centipawns": score.score(),
            "mate": score.mate(),
        },
        "best_move": principal_variation[0].uci() if principal_variation else None,
        "principal_variation": [move.uci() for move in principal_variation],
        "depth": info.get("depth", depth),
        "engine": engine_name,
    }
