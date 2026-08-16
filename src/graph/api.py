"""
FastAPI layer over the Neo4j knowledge graph.

Run with:
    uvicorn src.graph.api:app --reload

Then open:
    http://127.0.0.1:8000/docs
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from neo4j import GraphDatabase
from pydantic import BaseModel

from src.graph.queries import (
    immediate_prerequisites,
    full_prerequisite_chain,
    downstream_impact,
    foundational_centrality,
    student_remediation,
    list_semesters,
    list_courses,
    get_course,
    list_topics_for_course,
    list_topics,
    search_topics,
    get_topic,
    overview_stats,
    full_topic_graph,
    course_prerequisites,
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


# ---------------------------------------------------------------------------
# Neo4j lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global driver

    driver = GraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USER, NEO4J_PASSWORD),
    )

    yield

    driver.close()


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Curriculum Knowledge Graph API",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===========================================================================
# CURRICULUM GET ENDPOINTS
# ===========================================================================

@app.get("/semesters")
def get_semesters():
    """List every semester with its courses."""
    with driver.session() as session:
        result = list_semesters(session)

    return result


@app.get("/semesters/{semester}/courses")
def get_courses_by_semester(semester: int):
    """List courses belonging to a specific semester."""
    with driver.session() as session:
        result = list_courses(session, semester)

    return result


@app.get("/courses")
def get_courses():
    """List all courses."""
    with driver.session() as session:
        result = list_courses(session)

    return result


@app.get("/courses/{course_code}/topics")
def get_course_topics(course_code: str):
    """List all topics belonging to a course."""

    with driver.session() as session:

        exists = session.run(
            """
            MATCH (c:Course {course_code: $course_code})
            RETURN c
            """,
            course_code=course_code,
        ).single()

        if not exists:
            raise HTTPException(
                status_code=404,
                detail=f"Course '{course_code}' does not exist",
            )

        result = list_topics_for_course(session, course_code)

    return result


@app.get("/courses/{course_code}/prerequisites")
def get_course_prerequisite_list(course_code: str):
    """List prerequisite courses for a course."""

    with driver.session() as session:

        exists = session.run(
            """
            MATCH (c:Course {course_code: $course_code})
            RETURN c
            """,
            course_code=course_code,
        ).single()

        if not exists:
            raise HTTPException(
                status_code=404,
                detail=f"Course '{course_code}' does not exist",
            )

        result = course_prerequisites(session, course_code)

    return {
        "course_code": course_code,
        "prerequisites": result,
    }


@app.get("/courses/{course_code}")
def get_course_detail(course_code: str):
    """Get course details, topics and course prerequisites."""

    with driver.session() as session:
        result = get_course(session, course_code)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Course '{course_code}' does not exist",
        )

    return result


# ===========================================================================
# TOPIC GET ENDPOINTS
# ===========================================================================
#
# IMPORTANT:
# Fixed routes such as /topics/search, /topics/centrality and
# /topics/graph MUST appear before /topics/{topic_id}.
# ===========================================================================

@app.get("/topics/search")
def search_topic_endpoint(q: str = ""):
    """Search topics by ID or name."""

    if not q.strip():
        return []

    with driver.session() as session:
        result = search_topics(session, q.strip())

    return result


@app.get("/topics/centrality")
def get_foundational_centrality(limit: int = 5):
    """Return the most foundational topics."""

    with driver.session() as session:
        result = foundational_centrality(session, limit)

    return {
        "most_foundational": result
    }


@app.get("/topics/graph")
def get_topic_graph():
    """Return the complete topic prerequisite graph."""

    with driver.session() as session:
        result = full_topic_graph(session)

    return result


@app.get("/topics")
def get_topics():
    """List all topics."""

    with driver.session() as session:
        result = list_topics(session)

    return result


@app.get("/topics/{topic_id}/prerequisites")
def get_immediate_prerequisites(topic_id: str):
    """Return direct prerequisites for a topic."""

    with driver.session() as session:
        result = immediate_prerequisites(session, topic_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No prerequisites found for {topic_id}",
        )

    return {
        "topic_id": topic_id,
        "prerequisites": result,
    }


@app.get("/topics/{topic_id}/prerequisite-chain")
def get_full_prerequisite_chain(topic_id: str):
    """Return the full prerequisite chain for a topic."""

    with driver.session() as session:
        result = full_prerequisite_chain(session, topic_id)

    return {
        "topic_id": topic_id,
        "chains": result,
    }


@app.get("/topics/{topic_id}/downstream")
def get_downstream_impact(topic_id: str):
    """Return topics unlocked downstream from a topic."""

    with driver.session() as session:
        result = downstream_impact(session, topic_id)

    return {
        "topic_id": topic_id,
        "unlocks": result,
    }


@app.get("/topics/{topic_id}")
def get_topic_detail(topic_id: str):
    """Return details for a single topic."""

    with driver.session() as session:
        result = get_topic(session, topic_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Topic '{topic_id}' does not exist",
        )

    return result


# ===========================================================================
# OVERVIEW / STATISTICS
# ===========================================================================

@app.get("/stats/overview")
def get_overview_stats():
    """Return high-level curriculum statistics."""

    with driver.session() as session:
        result = overview_stats(session)

    return result


# ===========================================================================
# STUDENT
# ===========================================================================

@app.get("/students/{student_id}/remediation")
def get_student_remediation(student_id: str):
    """Return prerequisite topics recommended for student remediation."""

    with driver.session() as session:
        result = student_remediation(session, student_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No remediation data found for {student_id}",
        )

    return {
        "student_id": student_id,
        "remediation": result,
    }


# ===========================================================================
# POST — FACULTY OPERATIONS
# ===========================================================================

@app.post("/topics")
def create_topic_endpoint(request: CreateTopicRequest):
    """Create a new topic with an automatically generated topic ID."""

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
    """Add a prerequisite relationship between two topics."""

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
    """Add a prerequisite relationship between two courses."""

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


# ===========================================================================
# HEALTH
# ===========================================================================

@app.get("/health")
def health_check():
    """API health check."""

    return {
        "status": "ok"
    }