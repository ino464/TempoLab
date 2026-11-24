import { Chess } from "chess.js";

export type EngineEvaluation = {
  centipawns: number | null;
  mate: number | null;
};

/** Describe an engine score, which is always from White's perspective. */
export function formatEvaluation(score: EngineEvaluation, fen: string): string {
  if (score.mate !== null) {
    if (score.mate === 0) {
      try {
        const board = new Chess(fen);
        if (board.isCheckmate()) {
          return `${board.turn() === "w" ? "Black" : "White"} wins by checkmate`;
        }
      } catch {
        // An invalid FEN cannot establish which side won.
      }
      return "Checkmate (winner unavailable)";
    }

    const side = score.mate > 0 ? "White" : "Black";
    return `${side} has mate in ${Math.abs(score.mate)}`;
  }

  if (score.centipawns === null) return "Unavailable";
  const pawns = (score.centipawns / 100).toFixed(2);
  return score.centipawns > 0 ? `+${pawns}` : pawns;
}
