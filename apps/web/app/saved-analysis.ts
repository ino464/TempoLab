import type { EngineEvaluation } from "./evaluation";

export type EngineProvenance = {
  engine_name: string;
  requested_depth: number;
  reported_depth: number | null;
  search_duration_ms: number;
  search_started_at: string;
};

export type CriticalPosition = {
  ply: number;
  move: string;
  fen_before: string;
  fen_after: string;
  best_move_before: string | null;
  principal_variation_before: string[];
  centipawn: number | null;
  evaluation_before: EngineEvaluation;
  evaluation_after: EngineEvaluation;
  provenance_before: EngineProvenance;
  provenance_after: EngineProvenance;
};

export type AnalysisResponse = {
  analysis: CriticalPosition[];
  critical_positions: CriticalPosition[];
};

export type SavedAnalysis = {
  format: "tempolab-analysis";
  version: 1;
  pgn: string;
  result: AnalysisResponse;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumberOrNull(value: unknown): boolean {
  return (
    value === null || (typeof value === "number" && Number.isFinite(value))
  );
}

function isEvaluation(value: unknown): boolean {
  return (
    isObject(value) &&
    isNumberOrNull(value.centipawns) &&
    isNumberOrNull(value.mate)
  );
}

function isProvenance(value: unknown): boolean {
  return (
    isObject(value) &&
    typeof value.engine_name === "string" &&
    typeof value.requested_depth === "number" &&
    Number.isFinite(value.requested_depth) &&
    isNumberOrNull(value.reported_depth) &&
    typeof value.search_duration_ms === "number" &&
    Number.isFinite(value.search_duration_ms) &&
    typeof value.search_started_at === "string"
  );
}

function isPosition(value: unknown): value is CriticalPosition {
  return (
    isObject(value) &&
    Number.isInteger(value.ply) &&
    (value.ply as number) > 0 &&
    typeof value.move === "string" &&
    typeof value.fen_before === "string" &&
    typeof value.fen_after === "string" &&
    (value.best_move_before === null ||
      typeof value.best_move_before === "string") &&
    Array.isArray(value.principal_variation_before) &&
    value.principal_variation_before.every(
      (move: unknown) => typeof move === "string",
    ) &&
    isNumberOrNull(value.centipawn) &&
    isEvaluation(value.evaluation_before) &&
    isEvaluation(value.evaluation_after) &&
    isProvenance(value.provenance_before) &&
    isProvenance(value.provenance_after)
  );
}

/** Validate the file format and resolve critical positions to the full move list. */
export function parseSavedAnalysis(text: string): SavedAnalysis {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (
    !isObject(data) ||
    data.format !== "tempolab-analysis" ||
    data.version !== 1 ||
    typeof data.pgn !== "string" ||
    !isObject(data.result) ||
    !Array.isArray(data.result.analysis) ||
    !Array.isArray(data.result.critical_positions) ||
    data.result.analysis.length === 0 ||
    !data.result.analysis.every(isPosition) ||
    !data.result.critical_positions.every(isPosition)
  ) {
    throw new Error("This is not a supported TempoLab analysis file.");
  }
  const analysis = data.result.analysis as CriticalPosition[];
  const critical = data.result.critical_positions as CriticalPosition[];
  const moves = new Map(analysis.map((position) => [position.ply, position]));
  if (
    moves.size !== analysis.length ||
    new Set(critical.map((position) => position.ply)).size !==
      critical.length ||
    critical.some((position) => !moves.has(position.ply))
  ) {
    throw new Error("This analysis file has inconsistent move references.");
  }
  return {
    format: "tempolab-analysis",
    version: 1,
    pgn: data.pgn,
    result: {
      analysis,
      critical_positions: critical.map((position) => moves.get(position.ply)!),
    },
  };
}
