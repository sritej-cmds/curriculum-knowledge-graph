"""
FastAPI layer over the Neo4j knowledge graph.
Run with: uvicorn src.graph.api:app --reload
Then open http://127.0.0.1:8000/docs for interactive testing.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from neo4j import GraphDatabase

from src.graph.queries import (
    immediate_prerequisites,
    full_prerequisite_chain,
    downstream_impact,
    foundational_centrality,
    student_remediation,
)

load_dotenv()

NEO4J_URI = os.environ["NEO4J_URI"]
NEO4J_USER = os.environ["NEO4J_USER"]
NEO4J_PASSWORD = os.environ["NEO4J_PASSWORD"]

driver = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global driver
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    yield
    driver.close()


app = FastAPI(title="Curriculum Knowledge Graph API", lifespan=lifespan)


@app.get("/topics/{topic_id}/prerequisites")
def get_immediate_prerequisites(topic_id: str):
    with driver.session() as session:
        result = immediate_prerequisites(session, topic_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"No prerequisites found for {topic_id}")
    return {"topic_id": topic_id, "prerequisites": result}


@app.get("/topics/{topic_id}/prerequisite-chain")
def get_full_prerequisite_chain(topic_id: str):
    with driver.session() as session:
        result = full_prerequisite_chain(session, topic_id)
    return {"topic_id": topic_id, "chains": result}


@app.get("/topics/{topic_id}/downstream")
def get_downstream_impact(topic_id: str):
    with driver.session() as session:
        result = downstream_impact(session, topic_id)
    return {"topic_id": topic_id, "unlocks": result}


@app.get("/topics/centrality")
def get_foundational_centrality(limit: int = 5):
    with driver.session() as session:
        result = foundational_centrality(session, limit)
    return {"most_foundational": result}


@app.get("/students/{student_id}/remediation")
def get_student_remediation(student_id: str):
    with driver.session() as session:
        result = student_remediation(session, student_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"No remediation data found for {student_id}")
    return {"student_id": student_id, "remediation": result}


@app.get("/health")
def health_check():
    return {"status": "ok"}
