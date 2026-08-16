"""
The 5 MVP acceptance-criteria queries, as parameterized Cypher.
Each function takes an active Neo4j session and returns plain Python data.
"""


def immediate_prerequisites(session, topic_id):
    """What concepts are directly required before this topic?"""
    result = session.run(
        """
        MATCH (prereq:Topic)-[:PREREQUISITE_OF]->(t:Topic {topic_id: $topic_id})
        RETURN prereq.topic_id AS topic_id, prereq.name AS name
        """,
        topic_id=topic_id,
    )
    return [r.data() for r in result]


def full_prerequisite_chain(session, topic_id):
    """Complete recursive path back to foundational concepts."""
    result = session.run(
        """
        MATCH path = (foundation:Topic)-[:PREREQUISITE_OF*]->(t:Topic {topic_id: $topic_id})
        WHERE NOT ()-[:PREREQUISITE_OF]->(foundation)
        RETURN foundation.name AS foundation, [n IN nodes(path) | n.name] AS path
        """,
        topic_id=topic_id,
    )
    return [r.data() for r in result]


def downstream_impact(session, topic_id):
    """What downstream concepts are unlocked after mastering this topic?"""
    result = session.run(
        """
        MATCH (t:Topic {topic_id: $topic_id})-[:PREREQUISITE_OF*]->(downstream:Topic)
        RETURN DISTINCT downstream.topic_id AS topic_id, downstream.name AS name
        """,
        topic_id=topic_id,
    )
    return [r.data() for r in result]


def foundational_centrality(session, limit=5):
    """Which concepts hold the highest downstream dependencies?"""
    result = session.run(
        """
        MATCH (t:Topic)-[:PREREQUISITE_OF*]->(downstream:Topic)
        RETURN t.topic_id AS topic_id, t.name AS name, count(DISTINCT downstream) AS downstream_count
        ORDER BY downstream_count DESC
        LIMIT $limit
        """,
        limit=limit,
    )
    return [r.data() for r in result]


def student_remediation(session, student_id):
    """If a student struggles with a topic, which unmastered prerequisites should they revise?"""
    result = session.run(
        """
        MATCH (s:Student {id: $student_id})-[:STRUGGLES_WITH]->(t:Topic)
        MATCH path = (prereq:Topic)-[:PREREQUISITE_OF*]->(t)
        WHERE NOT (s)-[:MASTERED]->(prereq)
        RETURN DISTINCT t.name AS struggling_topic, prereq.name AS recommended_revision
        """,
        student_id=student_id,
    )
    return [r.data() for r in result]

def course_exists(session, course_code):
    """Check whether a course exists."""
    result = session.run(
        """
        MATCH (c:Course {course_code: $course_code})
        RETURN c.course_code AS course_code
        """,
        course_code=course_code,
    )
    return result.single() is not None


def topic_exists(session, topic_id):
    """Check whether a topic exists."""
    result = session.run(
        """
        MATCH (t:Topic {topic_id: $topic_id})
        RETURN t.topic_id AS topic_id
        """,
        topic_id=topic_id,
    )
    return result.single() is not None


def topic_exists_in_course(session, course_code, topic_name):
    """Check whether a topic with this name already exists in a course."""
    result = session.run(
        """
        MATCH (c:Course {course_code: $course_code})-[:CONTAINS]->(t:Topic)
        WHERE toLower(t.name) = toLower($topic_name)
        RETURN t.topic_id AS topic_id
        """,
        course_code=course_code,
        topic_name=topic_name,
    )
    return result.single()


def get_topic_ids_for_course(session, course_code):
    """Get all topic IDs belonging to a course."""
    result = session.run(
        """
        MATCH (c:Course {course_code: $course_code})-[:CONTAINS]->(t:Topic)
        RETURN t.topic_id AS topic_id
        """,
        course_code=course_code,
    )
    return [record["topic_id"] for record in result]


def create_topic(
    session,
    course_code,
    topic_id,
    name,
    unit,
    description,
):
    """Create a topic and connect it to its course."""
    result = session.run(
        """
        MATCH (c:Course {course_code: $course_code})
        CREATE (t:Topic {
            topic_id: $topic_id,
            name: $name,
            unit: $unit,
            description: $description
        })
        CREATE (c)-[:CONTAINS]->(t)
        RETURN t.topic_id AS topic_id,
               t.name AS name,
               t.unit AS unit,
               t.description AS description,
               c.course_code AS course_code
        """,
        course_code=course_code,
        topic_id=topic_id,
        name=name,
        unit=unit,
        description=description,
    )

    record = result.single()
    return record.data() if record else None


def topic_prerequisite_exists(session, prerequisite_id, target_id):
    """Check whether a topic prerequisite already exists."""
    result = session.run(
        """
        MATCH (p:Topic {topic_id: $prerequisite_id})
              -[:PREREQUISITE_OF]->
              (t:Topic {topic_id: $target_id})
        RETURN p.topic_id AS prerequisite_id
        """,
        prerequisite_id=prerequisite_id,
        target_id=target_id,
    )
    return result.single() is not None


def course_prerequisite_exists(session, prerequisite_code, target_code):
    """Check whether a course prerequisite already exists."""
    result = session.run(
        """
        MATCH (p:Course {course_code: $prerequisite_code})
              -[:PREREQUISITE_OF]->
              (t:Course {course_code: $target_code})
        RETURN p.course_code AS prerequisite_code
        """,
        prerequisite_code=prerequisite_code,
        target_code=target_code,
    )
    return result.single() is not None


def topic_path_exists(session, start_id, end_id):
    """
    Check whether a prerequisite path already exists from start topic
    to end topic.
    """
    result = session.run(
        """
        MATCH (start:Topic {topic_id: $start_id})
              -[:PREREQUISITE_OF*]->
              (end:Topic {topic_id: $end_id})
        RETURN end
        LIMIT 1
        """,
        start_id=start_id,
        end_id=end_id,
    )
    return result.single() is not None


def course_path_exists(session, start_code, end_code):
    """
    Check whether a prerequisite path already exists from start course
    to end course.
    """
    result = session.run(
        """
        MATCH (start:Course {course_code: $start_code})
              -[:PREREQUISITE_OF*]->
              (end:Course {course_code: $end_code})
        RETURN end
        LIMIT 1
        """,
        start_code=start_code,
        end_code=end_code,
    )
    return result.single() is not None


def create_topic_prerequisite(session, prerequisite_id, target_id):
    """Create a Topic -> Topic prerequisite relationship."""
    result = session.run(
        """
        MATCH (p:Topic {topic_id: $prerequisite_id})
        MATCH (t:Topic {topic_id: $target_id})
        CREATE (p)-[:PREREQUISITE_OF]->(t)
        RETURN p.topic_id AS prerequisite_id,
               t.topic_id AS target_id
        """,
        prerequisite_id=prerequisite_id,
        target_id=target_id,
    )

    record = result.single()
    return record.data() if record else None


def create_course_prerequisite(
    session,
    prerequisite_code,
    target_code,
):
    """Create a Course -> Course prerequisite relationship."""
    result = session.run(
        """
        MATCH (p:Course {course_code: $prerequisite_code})
        MATCH (t:Course {course_code: $target_code})
        CREATE (p)-[:PREREQUISITE_OF]->(t)
        RETURN p.course_code AS prerequisite_code,
               t.course_code AS target_code
        """,
        prerequisite_code=prerequisite_code,
        target_code=target_code,
    )

    record = result.single()
    return record.data() if record else None

# ---------------------------------------------------------------------------
# Curriculum browsing / read queries
# ---------------------------------------------------------------------------

def list_semesters(session):
    """Return every semester with its courses."""
    result = session.run(
        """
        MATCH (s:Semester)
        OPTIONAL MATCH (s)-[:HAS_COURSE]->(c:Course)
        RETURN s.number AS number,
               collect(
                   CASE
                       WHEN c IS NOT NULL THEN {
                           course_code: c.course_code,
                           name: c.name
                       }
                   END
               ) AS courses
        ORDER BY s.number
        """
    )

    return [
        {
            "number": record["number"],
            "courses": [
                course
                for course in record["courses"]
                if course is not None
            ],
        }
        for record in result
    ]


def list_courses(session, semester=None):
    """Return all courses, optionally filtered by semester."""
    if semester is None:
        result = session.run(
            """
            MATCH (c:Course)
            OPTIONAL MATCH (s:Semester)-[:HAS_COURSE]->(c)
            RETURN c.course_code AS course_code,
                   c.name AS name,
                   s.number AS semester
            ORDER BY s.number, c.course_code
            """
        )
    else:
        result = session.run(
            """
            MATCH (s:Semester {number: $semester})-[:HAS_COURSE]->(c:Course)
            RETURN c.course_code AS course_code,
                   c.name AS name,
                   s.number AS semester
            ORDER BY c.course_code
            """,
            semester=semester,
        )

    return [record.data() for record in result]


def get_course(session, course_code):
    """Return course details including topics and course prerequisites."""
    result = session.run(
        """
        MATCH (c:Course {course_code: $course_code})
        OPTIONAL MATCH (s:Semester)-[:HAS_COURSE]->(c)
        OPTIONAL MATCH (c)-[:CONTAINS]->(t:Topic)
        OPTIONAL MATCH (prereq:Course)-[:PREREQUISITE_OF]->(c)

        RETURN c.course_code AS course_code,
               c.name AS name,
               s.number AS semester,
               collect(
                   DISTINCT CASE
                       WHEN t IS NOT NULL THEN {
                           topic_id: t.topic_id,
                           name: t.name,
                           unit: t.unit
                       }
                   END
               ) AS topics,
               collect(DISTINCT prereq.course_code) AS prerequisite_courses
        """,
        course_code=course_code,
    )

    record = result.single()

    if not record:
        return None

    return {
        "course_code": record["course_code"],
        "name": record["name"],
        "semester": record["semester"],
        "topics": [
            topic
            for topic in record["topics"]
            if topic is not None
        ],
        "prerequisite_courses": record["prerequisite_courses"],
    }


def list_topics_for_course(session, course_code):
    """Return all topics belonging to a course."""
    result = session.run(
        """
        MATCH (c:Course {course_code: $course_code})
              -[:CONTAINS]->(t:Topic)
        RETURN t.topic_id AS topic_id,
               t.name AS name,
               t.unit AS unit,
               t.description AS description,
               c.course_code AS course_code
        ORDER BY t.unit, t.topic_id
        """,
        course_code=course_code,
    )

    return [record.data() for record in result]


def list_topics(session):
    """Return every topic in the curriculum."""
    result = session.run(
        """
        MATCH (c:Course)-[:CONTAINS]->(t:Topic)
        OPTIONAL MATCH (s:Semester)-[:HAS_COURSE]->(c)
        RETURN t.topic_id AS topic_id,
               t.name AS name,
               t.unit AS unit,
               t.description AS description,
               c.course_code AS course_code,
               s.number AS semester
        ORDER BY s.number, c.course_code, t.unit, t.topic_id
        """
    )

    return [record.data() for record in result]


def search_topics(session, query):
    """Search topics by topic ID or name."""
    result = session.run(
        """
        MATCH (c:Course)-[:CONTAINS]->(t:Topic)
        WHERE toLower(t.topic_id) CONTAINS toLower($query)
           OR toLower(t.name) CONTAINS toLower($query)
        RETURN t.topic_id AS topic_id,
               t.name AS name,
               t.unit AS unit,
               t.description AS description,
               c.course_code AS course_code
        ORDER BY t.topic_id
        LIMIT 50
        """,
        query=query,
    )

    return [record.data() for record in result]


def get_topic(session, topic_id):
    """Return details for one topic."""
    result = session.run(
        """
        MATCH (c:Course)-[:CONTAINS]->(t:Topic {topic_id: $topic_id})
        RETURN t.topic_id AS topic_id,
               t.name AS name,
               t.unit AS unit,
               t.description AS description,
               c.course_code AS course_code
        """,
        topic_id=topic_id,
    )

    record = result.single()
    return record.data() if record else None


def overview_stats(session):
    """Return high-level curriculum counts."""
    result = session.run(
        """
        OPTIONAL MATCH (s:Semester)
        WITH count(DISTINCT s) AS semesters

        OPTIONAL MATCH (c:Course)
        WITH semesters, count(DISTINCT c) AS courses

        OPTIONAL MATCH (t:Topic)
        WITH semesters, courses, count(DISTINCT t) AS topics

        OPTIONAL MATCH ()-[r:PREREQUISITE_OF]->()
        RETURN semesters,
               courses,
               topics,
               count(r) AS relationships
        """
    )

    record = result.single()

    return {
        "semesters": record["semesters"],
        "courses": record["courses"],
        "topics": record["topics"],
        "relationships": record["relationships"],
    }


def full_topic_graph(session):
    """Return the complete topic prerequisite graph."""
    nodes_result = session.run(
        """
        MATCH (t:Topic)
        RETURN t.topic_id AS id,
               t.name AS name
        ORDER BY t.topic_id
        """
    )

    edges_result = session.run(
        """
        MATCH (a:Topic)-[:PREREQUISITE_OF]->(b:Topic)
        RETURN a.topic_id AS source,
               b.topic_id AS target
        ORDER BY a.topic_id, b.topic_id
        """
    )

    return {
        "nodes": [record.data() for record in nodes_result],
        "edges": [record.data() for record in edges_result],
    }


def course_prerequisites(session, course_code):
    """Return courses that are prerequisites for the given course."""
    result = session.run(
        """
        MATCH (prereq:Course)-[:PREREQUISITE_OF]->(
            target:Course {course_code: $course_code}
        )
        RETURN prereq.course_code AS course_code,
               prereq.name AS name
        ORDER BY prereq.course_code
        """,
        course_code=course_code,
    )

    return [record.data() for record in result]