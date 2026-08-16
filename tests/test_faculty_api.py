"""
Tests for Person 2's faculty backend: topic creation, topic prerequisites,
and course prerequisites, including validation edge cases.

Run with: pytest tests/test_faculty_api.py -v

These tests hit the REAL Neo4j database configured in your .env --
there is no mocking. Test data is prefixed with PYTEST_ so it's easy
to spot and clean up in Aura afterwards.
"""

import pytest
from fastapi.testclient import TestClient

from src.graph.api import app

# Must already exist in the database (loaded via loader.py).
VALID_COURSE = "UE25CS151A"
INVALID_COURSE = "PYTEST_FAKE_COURSE"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _create_topic(client, name, unit=1, course=VALID_COURSE):
    """Helper: create a topic and return its response."""
    return client.post(
        "/topics",
        json={
            "course_code": course,
            "name": name,
            "unit": unit,
            "description": "Created by automated test",
        },
    )


# ---------- Topic creation ----------

def test_valid_topic_creation(client):
    response = _create_topic(client, "PYTEST_Valid Topic")
    assert response.status_code == 200
    data = response.json()["topic"]
    assert data["course_code"] == VALID_COURSE
    assert data["topic_id"].startswith("PY_")  # auto-generated, matches course prefix


def test_invalid_course(client):
    response = _create_topic(client, "PYTEST_Should Not Exist", course=INVALID_COURSE)
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]


def test_duplicate_topic(client):
    _create_topic(client, "PYTEST_Duplicate Topic")  # first creation, should succeed
    response = _create_topic(client, "PYTEST_Duplicate Topic")  # second, should fail
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_topic_id_auto_generated_not_client_supplied(client):
    """Faculty should never be able to set their own topic_id."""
    response = client.post(
        "/topics",
        json={
            "course_code": VALID_COURSE,
            "name": "PYTEST_Auto ID Check",
            "unit": 1,
            "topic_id": "PY_999",  # should be ignored / rejected, not accepted
        },
    )
    # Either FastAPI rejects the unexpected field (422) or ignores it and
    # still auto-generates -- both are acceptable, but it must NOT be PY_999.
    if response.status_code == 200:
        assert response.json()["topic"]["topic_id"] != "PY_999"


# ---------- Topic prerequisites ----------

def test_valid_topic_prerequisite(client):
    t1 = _create_topic(client, "PYTEST_Prereq Source").json()["topic"]["topic_id"]
    t2 = _create_topic(client, "PYTEST_Prereq Target").json()["topic"]["topic_id"]

    response = client.post(
        "/topic-prerequisites",
        json={"prerequisite_topic_id": t1, "target_topic_id": t2},
    )
    assert response.status_code == 200
    assert response.json()["prerequisite"]["prerequisite_id"] == t1
    assert response.json()["prerequisite"]["target_id"] == t2


def test_invalid_topic_prerequisite(client):
    response = client.post(
        "/topic-prerequisites",
        json={
            "prerequisite_topic_id": "PYTEST_FAKE_1",
            "target_topic_id": "PYTEST_FAKE_2",
        },
    )
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]


def test_self_prerequisite(client):
    t1 = _create_topic(client, "PYTEST_Self Ref Topic").json()["topic"]["topic_id"]
    response = client.post(
        "/topic-prerequisites",
        json={"prerequisite_topic_id": t1, "target_topic_id": t1},
    )
    assert response.status_code == 400
    assert "own prerequisite" in response.json()["detail"]


def test_duplicate_topic_prerequisite(client):
    t1 = _create_topic(client, "PYTEST_Dup Prereq A").json()["topic"]["topic_id"]
    t2 = _create_topic(client, "PYTEST_Dup Prereq B").json()["topic"]["topic_id"]

    first = client.post(
        "/topic-prerequisites",
        json={"prerequisite_topic_id": t1, "target_topic_id": t2},
    )
    assert first.status_code == 200

    second = client.post(
        "/topic-prerequisites",
        json={"prerequisite_topic_id": t1, "target_topic_id": t2},
    )
    assert second.status_code == 400
    assert "already exists" in second.json()["detail"]


def test_cyclic_topic_prerequisite(client):
    a = _create_topic(client, "PYTEST_Cycle A").json()["topic"]["topic_id"]
    b = _create_topic(client, "PYTEST_Cycle B").json()["topic"]["topic_id"]

    # A -> B (valid)
    first = client.post(
        "/topic-prerequisites",
        json={"prerequisite_topic_id": a, "target_topic_id": b},
    )
    assert first.status_code == 200

    # B -> A would create a cycle -- must be rejected
    second = client.post(
        "/topic-prerequisites",
        json={"prerequisite_topic_id": b, "target_topic_id": a},
    )
    assert second.status_code == 400
    assert "cycle" in second.json()["detail"]


# ---------- Course prerequisites ----------

def test_invalid_course_prerequisite(client):
    response = client.post(
        "/course-prerequisites",
        json={
            "prerequisite_course_code": INVALID_COURSE,
            "target_course_code": VALID_COURSE,
        },
    )
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]


def test_course_self_prerequisite(client):
    response = client.post(
        "/course-prerequisites",
        json={
            "prerequisite_course_code": VALID_COURSE,
            "target_course_code": VALID_COURSE,
        },
    )
    assert response.status_code == 400
    assert "own prerequisite" in response.json()["detail"]