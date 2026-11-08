from app.engine import analyze_position
from app.pgn import parse_pgn


def analyze(pgn_text):
    centipawns_difference = 0
    positions = parse_pgn(pgn_text)
    positions = positions[0]
    before_analysis = analyze_position(positions["fen_before"])
    after_analysis = analyze_position(positions["fen_after"])
    centipawns_difference = (
        after_analysis["evaluation"]["centipawns"]
        - before_analysis["evaluation"]["centipawns"]
    )
    evaluation = {
        "centipawns_difference": centipawns_difference,
        "ply": positions["ply"],
        "move": positions["move"],
        "best_move_before": before_analysis["best_move"],
        "principal_variation_before": before_analysis["principal_variation"],
        "best_move_after": after_analysis["best_move"],
        "principal_variation_after": after_analysis["principal_variation"],
    }
    return evaluation
