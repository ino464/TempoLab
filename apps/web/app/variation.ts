import { Chess } from "chess.js";

export type VariationReplay = {
  positions: string[];
  moves: string[];
  error: string | null;
};

/** Build each board position in a UCI principal variation. */
export function replayVariation(
  fen: string,
  variation: string[],
): VariationReplay {
  let board: Chess;
  try {
    board = new Chess(fen);
  } catch {
    return {
      positions: [],
      moves: [],
      error: "The starting position is invalid.",
    };
  }

  const positions = [board.fen()];
  const moves: string[] = [];

  for (const uci of variation) {
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) {
      return { positions, moves, error: `Invalid move in engine line: ${uci}` };
    }

    try {
      const move = board.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        ...(uci.length === 5 ? { promotion: uci[4] } : {}),
      });
      moves.push(move.san);
      positions.push(board.fen());
    } catch {
      return { positions, moves, error: `Illegal move in engine line: ${uci}` };
    }
  }

  return { positions, moves, error: null };
}
