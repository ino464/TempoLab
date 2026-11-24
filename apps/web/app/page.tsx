"use client";

import { useState } from "react";

type CriticalPosition = {
  ply: number;
  move: string;
  fen_before: string;
  best_move_before: string | null;
  centipawn: number | null;
};

type AnalysisResponse = {
  critical_positions: CriticalPosition[];
};

const pieces: Record<string, string> = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

function Chessboard({ fen }: { fen: string }) {
  const ranks = fen.split(" ")[0].split("/");
  const squares = ranks.flatMap((rank) =>
    Array.from(rank).flatMap((character) =>
      /^[1-8]$/.test(character)
        ? Array<string | null>(Number(character)).fill(null)
        : [character],
    ),
  );

  if (ranks.length !== 8 || squares.length !== 64) {
    return <p>Unable to display this position.</p>;
  }

  return (
    <div
      role="img"
      aria-label={`Chessboard, White at the bottom. Position: ${fen}`}
      className="grid aspect-square w-full max-w-sm grid-cols-8 grid-rows-8 border border-neutral-500"
    >
      {squares.map((piece, index) => {
        const dark = (Math.floor(index / 8) + (index % 8)) % 2 === 1;
        const square = `${"abcdefgh"[index % 8]}${8 - Math.floor(index / 8)}`;
        return (
          <div
            key={square}
            aria-hidden="true"
            className={`flex items-center justify-center text-3xl text-black sm:text-4xl ${dark ? "bg-neutral-400" : "bg-neutral-100"}`}
          >
            {piece ? pieces[piece] : null}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [pgn, setPgn] = useState("");
  const [positions, setPositions] = useState<CriticalPosition[] | null>(null);
  const [selectedPly, setSelectedPly] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setPositions(null);
    setSelectedPly(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pgn }),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const detail =
          body && typeof body === "object" && "detail" in body
            ? body.detail
            : null;
        throw new Error(
          typeof detail === "string"
            ? detail
            : `Analysis failed (HTTP ${response.status}).`,
        );
      }

      const result: AnalysisResponse = await response.json();
      setPositions(result.critical_positions);
      setSelectedPly(result.critical_positions[0]?.ply ?? null);
    } catch (error) {
      setError(
        error instanceof TypeError
          ? "Could not connect to the analysis service. Check that the backend is running."
          : error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedPosition = positions?.find(
    (position) => position.ply === selectedPly,
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">TempoLab</h1>

      <label htmlFor="pgn">Game PGN</label>
      <textarea
        id="pgn"
        value={pgn}
        onChange={(event) => {
          setPgn(event.target.value);
          setPositions(null);
          setSelectedPly(null);
          setError(null);
        }}
        placeholder="Paste your PGN here..."
        rows={10}
        disabled={loading}
        className="w-full resize-y border p-3"
      />

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading}
        className="self-start border px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze game"}
      </button>

      {loading && <p role="status">Analyzing your game with Stockfish...</p>}
      {error && <p role="alert">{error}</p>}

      {positions !== null && (
        <section aria-labelledby="critical-positions">
          <h2 id="critical-positions" className="text-xl font-semibold">
            Critical positions
          </h2>
          {positions.length === 0 ? (
            <p className="mt-2">No critical positions found.</p>
          ) : (
            <ol className="mt-2 list-inside list-decimal space-y-4">
              {positions.map((position) => (
                <li key={position.ply}>
                  <button
                    type="button"
                    onClick={() => setSelectedPly(position.ply)}
                    aria-pressed={selectedPly === position.ply}
                    className="underline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Move: {position.move} (ply {position.ply})
                  </button>
                  <p>Best move before: {position.best_move_before ?? "None"}</p>
                  <p>
                    {position.centipawn === null
                      ? "Evaluation change: mate score involved"
                      : `Evaluation change: ${position.centipawn > 0 ? "+" : ""}${position.centipawn} centipawns`}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {selectedPosition && (
        <section aria-labelledby="board-title" className="flex flex-col gap-3">
          <h2 id="board-title" className="text-xl font-semibold">
            Position before the move
          </h2>
          <Chessboard fen={selectedPosition.fen_before} />
          <p>White is at the bottom.</p>
        </section>
      )}
    </main>
  );
}
