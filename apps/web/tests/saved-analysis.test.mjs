import assert from "node:assert/strict";
import { test } from "node:test";

import { parseSavedAnalysis } from "../app/saved-analysis.ts";

function sample() {
  const provenance = {
    engine_name: "Stockfish 19",
    requested_depth: 14,
    reported_depth: 14,
    search_duration_ms: 10,
    search_started_at: "2026-11-24T00:00:00Z",
  };
  const move = {
    ply: 1,
    move: "e2e4",
    fen_before: "before",
    fen_after: "after",
    best_move_before: "e2e4",
    principal_variation_before: ["e2e4"],
    centipawn: -10,
    evaluation_before: { centipawns: 20, mate: null },
    evaluation_after: { centipawns: 10, mate: null },
    provenance_before: provenance,
    provenance_after: provenance,
  };
  return {
    format: "tempolab-analysis",
    version: 1,
    pgn: "1. e4 *",
    result: { analysis: [move], critical_positions: [move] },
  };
}

test("round trips the PGN, moves, and provenance", () => {
  const saved = sample();
  assert.deepEqual(parseSavedAnalysis(JSON.stringify(saved)), saved);
});

test("rejects malformed, unsupported, and incomplete files", () => {
  assert.throws(() => parseSavedAnalysis("not json"), /valid JSON/);
  const saved = sample();
  saved.version = 2;
  assert.throws(() => parseSavedAnalysis(JSON.stringify(saved)), /supported/);
  saved.version = 1;
  delete saved.result.analysis[0].provenance_before;
  assert.throws(() => parseSavedAnalysis(JSON.stringify(saved)), /supported/);
});

test("rejects critical moves missing from the full analysis", () => {
  const saved = sample();
  saved.result.critical_positions = [{ ...saved.result.analysis[0], ply: 2 }];
  assert.throws(
    () => parseSavedAnalysis(JSON.stringify(saved)),
    /inconsistent/,
  );
});
