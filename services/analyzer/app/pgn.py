import io

import chess.pgn


def parse_pgn(pgn_text):
    game = chess.pgn.read_game(io.StringIO(pgn_text))
    if game == None:
        raise ValueError("empty game")
    if game.errors:
        raise ValueError("PGN contains parsing error")
    board = game.board()
    fen_list = []
    ply = 0


    for ply, move in enumerate(game.mainline_moves(), start=1):
        fen_before = board.fen()
        board.push(move)
        fen_after = board.fen()
        fen_list.append(
            {
                "ply": ply,
                "fen_before": fen_before,
                "fen_after": fen_after,
                "move": move.uci(),
            }
        )
    if not fen_list:
        raise ValueError("Game contains no moves.")
    return fen_list
