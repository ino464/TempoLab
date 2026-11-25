"use client";

import { useMemo, useState, type ChangeEvent } from "react";

import { formatEvaluation } from "./evaluation";
import {
  parseSavedAnalysis,
  type AnalysisResponse,
  type CriticalPosition,
  type EngineProvenance,
  type SavedAnalysis,
} from "./saved-analysis";
import { formatGameMove, replayVariation } from "./variation";

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

function SearchDetails({
  label,
  provenance,
}: {
  label: string;
  provenance: EngineProvenance;
}) {
  return (
    <div>
      <h4 className="font-semibold">{label}</h4>
      <p>Engine: {provenance.engine_name}</p>
      <p>Requested depth: {provenance.requested_depth}</p>
      <p>Reported depth: {provenance.reported_depth ?? "Not reported"}</p>
      <p>Search duration: {provenance.search_duration_ms} ms</p>
      <p>
        Search started:{" "}
        <time dateTime={provenance.search_started_at}>
          {provenance.search_started_at}
        </time>
      </p>
    </div>
  );
}

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
  const [gameMoves, setGameMoves] = useState<CriticalPosition[] | null>(null);
  const [selectedPly, setSelectedPly] = useState<number | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  function showResult(result: AnalysisResponse) {
    setGameMoves(result.analysis);
    setPositions(result.critical_positions);
    setSelectedPly(
      result.critical_positions[0]?.ply ?? result.analysis[0]?.ply ?? null,
    );
    setReplayIndex(0);
  }

  function saveAnalysis() {
    if (!gameMoves || !positions) return;
    const saved: SavedAnalysis = {
      format: "tempolab-analysis",
      version: 1,
      pgn,
      result: { analysis: gameMoves, critical_positions: positions },
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "tempolab-analysis.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function openAnalysis(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Analysis file must be 5 MB or smaller.");
      const saved = parseSavedAnalysis(await file.text());
      setPgn(saved.pgn);
      showResult(saved.result);
      setImported(true);
      setError(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not open the analysis file.",
      );
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setPositions(null);
    setGameMoves(null);
    setSelectedPly(null);
    setReplayIndex(0);
    setImported(false);

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
      showResult(result);
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

  const selectedPosition = gameMoves?.find(
    (position) => position.ply === selectedPly,
  );
  const replay = useMemo(
    () =>
      selectedPosition
        ? replayVariation(
            selectedPosition.fen_before,
            selectedPosition.principal_variation_before,
          )
        : null,
    [selectedPosition],
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
          setGameMoves(null);
          setSelectedPly(null);
          setReplayIndex(0);
          setError(null);
          setImported(false);
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

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={saveAnalysis}
          disabled={loading || !gameMoves}
          className="border px-4 py-2 disabled:opacity-50"
        >
          Save analysis
        </button>
        <label htmlFor="saved-analysis">Open saved analysis</label>
        <input
          id="saved-analysis"
          type="file"
          accept=".json,application/json"
          onChange={openAnalysis}
          disabled={loading}
        />
      </div>
      {imported && (
        <p>
          Opened from a file. Imported results have not been rechecked by
          Stockfish.
        </p>
      )}

      {loading && <p role="status">Analyzing your game with Stockfish...</p>}
      {error && <p role="alert">{error}</p>}

      {gameMoves !== null && (
        <section aria-labelledby="game-moves">
          <h2 id="game-moves" className="text-xl font-semibold">
            Game moves
          </h2>
          <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {gameMoves.map((position) => (
              <li key={position.ply}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPly(position.ply);
                    setReplayIndex(0);
                  }}
                  aria-pressed={selectedPly === position.ply}
                  className="underline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {formatGameMove(position.fen_before, position.move)}
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

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
                    onClick={() => {
                      setSelectedPly(position.ply);
                      setReplayIndex(0);
                    }}
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
          <div>
            <h2 className="text-xl font-semibold">Selected move</h2>
            <p>
              {formatGameMove(
                selectedPosition.fen_before,
                selectedPosition.move,
              )}
            </p>
            <p>
              Before:{" "}
              {formatEvaluation(
                selectedPosition.evaluation_before,
                selectedPosition.fen_before,
              )}
            </p>
            <p>
              After:{" "}
              {formatEvaluation(
                selectedPosition.evaluation_after,
                selectedPosition.fen_after,
              )}
            </p>
            <p>Position evaluations are from White’s perspective.</p>
            <p>
              {selectedPosition.centipawn === null
                ? "Evaluation change: mate score involved"
                : `Change for the moving player: ${selectedPosition.centipawn > 0 ? "+" : ""}${selectedPosition.centipawn} centipawns`}
            </p>
          </div>
          <details>
            <summary>Analysis details</summary>
            <div className="mt-2 space-y-3">
              <SearchDetails
                label="Before the move"
                provenance={selectedPosition.provenance_before}
              />
              <SearchDetails
                label="After the move"
                provenance={selectedPosition.provenance_after}
              />
            </div>
          </details>
          <h2 id="board-title" className="text-xl font-semibold">
            {replayIndex === 0
              ? "Position before the move"
              : "Stockfish’s suggested line"}
          </h2>
          {replay?.positions[replayIndex] && (
            <Chessboard fen={replay.positions[replayIndex]} />
          )}
          <p>White is at the bottom.</p>
          <div>
            <h3 className="font-semibold">Stockfish’s best line</h3>
            <p className="mt-1 break-words">
              {replay && replay.moves.length > 0
                ? replay.moves.join(" ")
                : "No line available for this position."}
            </p>
          </div>
          {replay && (
            <>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setReplayIndex((index) => Math.max(0, index - 1))
                  }
                  disabled={replayIndex === 0}
                  className="border px-4 py-2 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReplayIndex((index) =>
                      Math.min(replay.moves.length, index + 1),
                    )
                  }
                  disabled={replayIndex >= replay.moves.length}
                  className="border px-4 py-2 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <p role="status">
                Line move {replayIndex} of {replay.moves.length}
                {replayIndex > 0 ? `: ${replay.moves[replayIndex - 1]}` : ""}
              </p>
              {replay.error && <p role="alert">{replay.error}</p>}
            </>
          )}
        </section>
      )}
    </main>
  );
}
