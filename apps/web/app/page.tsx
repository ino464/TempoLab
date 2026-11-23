"use client";

import { useState } from "react";

export default function Home() {
  const [pgn, setPgn] = useState("");

  function handleAnalyze() {
    console.log(pgn);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">TempoLab</h1>

      <label htmlFor="pgn">Game PGN</label>
      <textarea
        id="pgn"
        value={pgn}
        onChange={(event) => setPgn(event.target.value)}
        placeholder="Paste your PGN here..."
        rows={10}
        className="w-full resize-y border p-3"
      />

      <button
        type="button"
        onClick={handleAnalyze}
        className="self-start border px-4 py-2"
      >
        Analyze game
      </button>
    </main>
  );
}
