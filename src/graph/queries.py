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
