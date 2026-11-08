from app.engine import analyze_position
from app.pgn import parse_pgn


def analyze(pgn_text):
    positions = parse_pgn(pgn_text)
    positions = positions[0]
    before_analysis = analyze_position(positions["fen_before"])
    after_analysis = analyze_position(positions["fen_after"])
    before_cp = before_analysis["evaluation"]["centipawns"]
    after_cp = after_analysis["evaluation"]["centipawns"]

    if before_cp is None or after_cp is None:
        centipawns_difference = None
    else:
        centipawns_difference = after_cp - before_cp
    evaluation = {
        "centipawns_difference": centipawns_difference,
        "ply": positions["ply"],
        "move": positions["move"],
        "best_move_before": before_analysis["best_move"],
        "principal_variation_before": before_analysis["principal_variation"],
        "evaluation_before": before_analysis["evaluation"],
        "best_move_after": after_analysis["best_move"],
        "principal_variation_after": after_analysis["principal_variation"],
        "evaluation_after": after_analysis["evaluation"],
    }
    return evaluation
