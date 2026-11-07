# TempoLab
TempoLab is a verification-first chess study copilot. Stockfish generates deterministic evals, candidate moves, and decisive principal variations; versioned RAG retrieves chess context; an LLM produces structured coaching. Every chess claim traces to engine output or verified sources.

# Project Philosophy
TempoLab never treats an LLM as an authoritative chess engine. It builds a response using the quantatative evaluation retrieved from stockfish, and instructional reasoning originated from cited sources, or otherwise explicitly labeled as generated guidance. 

