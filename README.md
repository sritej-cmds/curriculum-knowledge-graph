# Curriculum Knowledge Graph

## Person 3 — Graph Database & Student Intelligence

Neo4j-backed knowledge graph for the C Programming curriculum, exposed via FastAPI.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your own Neo4j Aura credentials:
```bash
cp .env.example .env
```

Run the schema once against a fresh database (paste `cypher/schema.cypher` into the Aura Query console).

Load data:
```bash
python3 src/graph/loader.py
```

Run the API:
```bash
python3 -m uvicorn src.graph.api:app --reload
```
Then open http://127.0.0.1:8000/docs

## Endpoints

- `GET /topics/{topic_id}/prerequisites` — immediate prerequisites
- `GET /topics/{topic_id}/prerequisite-chain` — full recursive chain
- `GET /topics/{topic_id}/downstream` — downstream impact
- `GET /topics/centrality` — most foundational concepts
- `GET /students/{student_id}/remediation` — revision recommendations
- `GET /health` — health check

## Data contract

- `data/curriculum/c_topics.json` — from Person 1
- `data/relationships/c_prerequisites_validated.json` — from Person 2

Currently loaded with the 10-topic golden mock fixture. To load real data, replace those two files and re-run `loader.py` — it's idempotent (`MERGE`-based), safe to re-run any number of times.
