from pydantic import BaseModel, Field


class EngineEvaluation(BaseModel):
    """Stockfish's score from White's perspective."""

    centipawns: int | None
    mate: int | None


class MoveAnalysis(BaseModel):
    """Analysis of one played move and the positions around it."""

    centipawn: int | None = Field(
        description="Evaluation change for the player who moved; positive is better."
    )
    ply: int
    move: str
    fen_before: str
    fen_after: str
    best_move_before: str | None
    principal_variation_before: list[str]
    evaluation_before: EngineEvaluation
    best_move_after: str | None
    principal_variation_after: list[str]
    evaluation_after: EngineEvaluation


class AnalysisResponse(BaseModel):
    """The full game analysis and up to three ranked critical moves."""

    analysis: list[MoveAnalysis]
    critical_positions: list[MoveAnalysis]
