from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.analysis import analyze, mistakes
from app.pgn import PGNError
from app.schemas import AnalysisResponse


class AnalysisRequest(BaseModel):
    pgn: str


app = FastAPI(title="TempoLab Analyzer")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/analyze", response_model=AnalysisResponse)
def analyze_game(request: AnalysisRequest):
    try:
        analysis = analyze(request.pgn)
    except PGNError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    mistakelist = mistakes(analysis)
    return {"analysis": analysis, "critical_positions": mistakelist}
