import chess

from app.engine import analyze_position
from app.pgn import parse_pgn


def analyze(pgn_text):
    evaluations = []
    positions = parse_pgn(pgn_text)
    for position in positions:
        board = chess.Board(position["fen_before"])
        before_analysis = analyze_position(position["fen_before"])
        after_analysis = analyze_position(position["fen_after"])
        before_cp = before_analysis["evaluation"]["centipawns"]
        after_cp = after_analysis["evaluation"]["centipawns"]

        if before_cp is None or after_cp is None:
            centipawns_difference = None
            centipawns_change = None

        else:
            centipawns_difference = after_cp - before_cp
            if board.turn == chess.WHITE:
                centipawns_change = centipawns_difference
            else:
                centipawns_change = -centipawns_difference

        evaluation = {
            "centipawn": centipawns_change,
            "ply": position["ply"],
            "move": position["move"],
            "fen_before": position["fen_before"],
            "fen_after": position["fen_after"],
            "best_move_before": before_analysis["best_move"],
            "principal_variation_before": before_analysis["principal_variation"],
            "evaluation_before": before_analysis["evaluation"],
            "best_move_after": after_analysis["best_move"],
            "principal_variation_after": after_analysis["principal_variation"],
            "evaluation_after": after_analysis["evaluation"],
        }
        evaluations.append(evaluation)
    return evaluations


def mistakes(analysis):
    """Rank up to three worsening moves, including changes in forced mate."""
    ranked = []
    for evaluation in analysis:
        change = evaluation["centipawn"]
        if change is not None:
            if change < 0:
                ranked.append(((2, change), evaluation))
            continue

        # Older callers may only have a numeric change, without mate details.
        if not all(
            key in evaluation
            for key in (
                "fen_before",
                "fen_after",
                "evaluation_before",
                "evaluation_after",
            )
        ):
            continue

        mover = chess.Board(evaluation["fen_before"]).turn
        before = _mate_rank(
            evaluation["evaluation_before"], evaluation["fen_before"], mover
        )
        after = _mate_rank(
            evaluation["evaluation_after"], evaluation["fen_after"], mover
        )
        if before is None or after is None:
            continue

        # A category change (win / no forced mate / loss) outranks a change
        # in mate distance, which in turn outranks ordinary centipawn drops.
        if after[0] < before[0]:
            ranked.append(((0, after[0] - before[0]), evaluation))
        elif after[0] == before[0] and after[1] < before[1]:
            ranked.append(((1, after[1] - before[1]), evaluation))

    ranked.sort(key=lambda item: item[0])
    return [evaluation for _, evaluation in ranked[:3]]


def _mate_rank(score, fen, mover):
    """Return a mover-relative outcome category and mate-distance preference."""
    mate = score.get("mate")
    if mate is None:
        return (0, 0) if score.get("centipawns") is not None else None

    if mate == 0:
        board = chess.Board(fen)
        if not board.is_checkmate():
            return None
        winner = not board.turn
    else:
        winner = chess.WHITE if mate > 0 else chess.BLACK

    if winner == mover:
        return (1, -abs(mate))  # Faster wins are better.
    return (-1, abs(mate))  # Slower losses are better.
