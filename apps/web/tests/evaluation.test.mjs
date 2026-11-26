import assert from "node:assert/strict";
import test from "node:test";

import { formatEvaluation } from "../app/evaluation.ts";

const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const foolsMate =
  "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";

test("formats positive, negative, zero, and unavailable scores", () => {
  assert.equal(
    formatEvaluation({ centipawns: 27, mate: null }, start),
    "+0.27",
  );
  assert.equal(
    formatEvaluation({ centipawns: -74, mate: null }, start),
    "-0.74",
  );
  assert.equal(formatEvaluation({ centipawns: 0, mate: null }, start), "0.00");
  assert.equal(
    formatEvaluation({ centipawns: null, mate: null }, start),
    "Unavailable",
  );
});

test("describes mate from White's perspective", () => {
  assert.equal(
    formatEvaluation({ centipawns: null, mate: 3 }, start),
    "White has mate in 3",
  );
  assert.equal(
    formatEvaluation({ centipawns: null, mate: -1 }, start),
    "Black has mate in 1",
  );
  assert.equal(
    formatEvaluation({ centipawns: null, mate: 0 }, foolsMate),
    "Black wins by checkmate",
  );
  assert.equal(
    formatEvaluation({ centipawns: null, mate: 0 }, start),
    "Checkmate (winner unavailable)",
  );
});
