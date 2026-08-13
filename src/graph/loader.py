"""
Loads c_topics.json and c_prerequisites_validated.json into Neo4j.
Safe to re-run any number of times -- uses MERGE everywhere, so it
never creates duplicate nodes or relationships.
"""

import json
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

# --- Set these in a local .env file (see .env.example) ---
NEO4J_URI = os.environ["NEO4J_URI"]
NEO4J_USER = os.environ["NEO4J_USER"]
NEO4J_PASSWORD = os.environ["NEO4J_PASSWORD"]

TOPICS_PATH = "fixtures/python_mvp_7_topics/topics.json"
EDGES_PATH = "data/relationships/python_prerequisites_validated.json"


def load_topics(tx, topics):
    for t in topics:
        tx.run(
            """
            MERGE (topic:Topic {topic_id: $topic_id})
            SET topic.name = $name,
                topic.unit = $unit,
                topic.description = $description
            MERGE (subject:Subject {name: $subject})
            MERGE (subject)-[:CONTAINS]->(topic)
            """,
            topic_id=t["topic_id"],
            name=t["name"],
            unit=t["unit"],
            description=t.get("description", ""),
            subject=t["subject"],
        )


def load_edges(tx, edges):
    for e in edges:
        if e["validation_status"] != "ACCEPTED":
            continue
        tx.run(
            """
            MATCH (a:Topic {topic_id: $source})
            MATCH (b:Topic {topic_id: $target})
            MERGE (a)-[r:PREREQUISITE_OF]->(b)
            SET r.confidence = $confidence,
                r.reason = $reason
            """,
            source=e["source"],
            target=e["target"],
            confidence=e["confidence"],
            reason=e["reason"],
        )


def main():
    with open(TOPICS_PATH) as f:
        topics_data = json.load(f)

    topics = topics_data["topics"]
    subject = topics_data["course"]["course_name"]

    for topic in topics:
        topic["subject"] = subject

    with open(EDGES_PATH) as f:
        edges = json.load(f)

    driver = GraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USER, NEO4J_PASSWORD)
    )

    with driver.session() as session:
        session.execute_write(load_topics, topics)
        session.execute_write(load_edges, edges)

    driver.close()

    print(
        f"Loaded {len(topics)} topics and "
        f"{len(edges)} prerequisite edges."
    )


if __name__ == "__main__":
    main()