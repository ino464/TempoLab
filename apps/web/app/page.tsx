"use client";

import { useState } from "react";

type CriticalPosition = {
  ply: number;
  move: string;
  best_move_before: string | null;
  centipawn: number | null;
};

type AnalysisResponse = {
  critical_positions: CriticalPosition[];
};

export default function Home() {
  const [pgn, setPgn] = useState("");
  const [positions, setPositions] = useState<CriticalPosition[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setPositions(null);

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
                  <p className="inline">Move: {position.move}</p>
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
    </main>
  );
}
