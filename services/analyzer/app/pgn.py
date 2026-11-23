import io

import chess.pgn


class PGNError(ValueError):
    """A PGN cannot be parsed into a usable game."""


def parse_pgn(pgn_text):
    game = chess.pgn.read_game(io.StringIO(pgn_text))
    if game is None:
        raise PGNError("empty game")
    if game.errors:
        raise PGNError("PGN contains parsing error") from game.errors[0]
    try:
        board = game.board()
    except ValueError as error:
        raise PGNError("PGN contains an invalid starting position") from error
    fen_list = []

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
        raise PGNError("Game contains no moves.")
    return fen_list
