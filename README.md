# TempoLab

TempoLab is a verification-first chess study copilot. Stockfish generates deterministic evals, candidate moves, and decisive principal variations; versioned RAG retrieves chess context; an LLM produces structured coaching. Every chess claim traces to engine output or verified sources.

# Project Philosophy

TempoLab never treats an LLM as an authoritative chess engine. It builds a response using the quantatative evaluation retrieved from stockfish, and instructional reasoning originated from cited sources, or otherwise explicitly labeled as generated guidance.

## Engine evaluation suite

The analyzer includes ten synthetic mate-in-one positions: five for White and five for Black. Each has one checkmating move, which is independently checked using python-chess before Stockfish is evaluated. The suite checks the engine's move and mate score at depth 8; it does not measure general chess strength or coaching quality.

From `services/analyzer`, run:

```powershell
uv run python -m evaluation.run
```

The command prints each result and exits with a nonzero status if any position fails. It requires the Stockfish executable configured in `app/engine.py`. The regular Python tests validate the positions without starting Stockfish.
