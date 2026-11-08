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

    for move in game.mainline_moves():
        ply+=1
        fen_before = board.fen()
        board.push(move)
        fen_after = board.fen()
        fen_list.append({"ply": ply, "fen_before": fen_before, "fen_after": fen_after, "move": move.uci()})
    return fen_list