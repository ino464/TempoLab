from datetime import UTC, datetime
from pathlib import Path
from time import perf_counter

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
        search_started_at = datetime.now(UTC).isoformat()
        search_start = perf_counter()
        info = engine.analyse(board, chess.engine.Limit(depth=depth))
        search_duration_ms = (perf_counter() - search_start) * 1000
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
        "provenance": {
            "engine_name": engine_name,
            "requested_depth": depth,
            "reported_depth": info.get("depth"),
            "search_duration_ms": round(search_duration_ms, 2),
            "search_started_at": search_started_at,
        },
    }
