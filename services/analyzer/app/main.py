from fastapi import FastAPI
from pydantic import BaseModel

from app.analysis import analyze, mistakes


class AnalysisRequest(BaseModel):
    pgn: str


app = FastAPI(title="TempoLab Analyzer")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/analyze")
def analyze_game(request: AnalysisRequest):
    analysis = analyze(request.pgn)
    mistakelist = mistakes(analysis)
    return {"analysis": analysis,
    "critical_positions": mistakelist,
    }
