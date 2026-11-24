import assert from "node:assert/strict";
import test from "node:test";

import { Chess } from "chess.js";
import { replayVariation } from "../app/variation.ts";

test("replays moves from the supplied starting position", () => {
  const initial = new Chess().fen();
  const replay = replayVariation(initial, ["e2e4", "e7e5", "g1f3"]);
  assert.deepEqual(replay.moves, ["e4", "e5", "Nf3"]);
  assert.equal(replay.positions.length, 4);
  assert.equal(replay.positions[0], initial);
  assert.equal(new Chess(replay.positions[3]).get("f3").type, "n");
  assert.equal(replay.error, null);
});

test("handles castling and promotion", () => {
  const castle = replayVariation("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", [
    "e1g1",
  ]);
  assert.deepEqual(castle.moves, ["O-O"]);
  assert.equal(new Chess(castle.positions[1]).get("f1").type, "r");

  const promotion = replayVariation("7k/P7/8/8/8/8/8/7K w - - 0 1", ["a7a8q"]);
  assert.equal(new Chess(promotion.positions[1]).get("a8").type, "q");
  assert.equal(promotion.error, null);
});

test("stops safely on invalid input and keeps the valid prefix", () => {
  const replay = replayVariation(new Chess().fen(), ["e2e4", "e2e5"]);
  assert.deepEqual(replay.moves, ["e4"]);
  assert.equal(replay.positions.length, 2);
  assert.match(replay.error, /Illegal move/);
  assert.match(replayVariation("invalid", []).error, /invalid/);
  assert.match(
    replayVariation(new Chess().fen(), ["oops"]).error,
    /Invalid move/,
  );
});
