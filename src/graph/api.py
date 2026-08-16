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
from pydantic import BaseModel

from src.graph.queries import (
    immediate_prerequisites,
    full_prerequisite_chain,
    downstream_impact,
    foundational_centrality,
    student_remediation,
)
from src.graph.services import (
    ValidationError,
    create_topic,
    add_topic_prerequisite,
    add_course_prerequisite,
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

class CreateTopicRequest(BaseModel):
    course_code: str
    name: str
    unit: int
    description: str = ""


class TopicPrerequisiteRequest(BaseModel):
    prerequisite_topic_id: str
    target_topic_id: str


class CoursePrerequisiteRequest(BaseModel):
    prerequisite_course_code: str
    target_course_code: str

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

@app.post("/topics")
def create_topic_endpoint(request: CreateTopicRequest):
    try:
        with driver.session() as session:
            result = create_topic(
                session,
                request.course_code,
                request.name,
                request.unit,
                request.description,
            )

        return {
            "message": "Topic created successfully",
            "topic": result,
        }

    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@app.post("/topic-prerequisites")
def add_topic_prerequisite_endpoint(
    request: TopicPrerequisiteRequest,
):
    try:
        with driver.session() as session:
            result = add_topic_prerequisite(
                session,
                request.prerequisite_topic_id,
                request.target_topic_id,
            )

        return {
            "message": "Topic prerequisite added successfully",
            "prerequisite": result,
        }

    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@app.post("/course-prerequisites")
def add_course_prerequisite_endpoint(
    request: CoursePrerequisiteRequest,
):
    try:
        with driver.session() as session:
            result = add_course_prerequisite(
                session,
                request.prerequisite_course_code,
                request.target_course_code,
            )

        return {
            "message": "Course prerequisite added successfully",
            "prerequisite": result,
        }

    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
    
@app.get("/health")
def health_check():
    return {"status": "ok"}
