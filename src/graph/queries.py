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
