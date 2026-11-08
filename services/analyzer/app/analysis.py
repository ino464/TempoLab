from app.engine import analyze_position
from app.pgn import parse_pgn
import chess


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
            if (board.turn == chess.WHITE):
                centipawns_change = centipawns_difference
            else:
                centipawns_change = -centipawns_difference

        evaluation = {
            "centipawn": centipawns_change,
            "ply": position["ply"],
            "move": position["move"],
            "best_move_before": before_analysis["best_move"],
            "principal_variation_before": before_analysis["principal_variation"],
            "evaluation_before": before_analysis["evaluation"],
            "best_move_after": after_analysis["best_move"],
            "principal_variation_after": after_analysis["principal_variation"],
            "evaluation_after": after_analysis["evaluation"],
        }
        evaluations.append(evaluation)
    return evaluations
