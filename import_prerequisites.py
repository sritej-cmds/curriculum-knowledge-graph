import json
import os

from dotenv import load_dotenv
from neo4j import GraphDatabase

from src.graph.services import (
    add_topic_prerequisite,
    ValidationError,
)

load_dotenv()

NEO4J_URI = os.environ["NEO4J_URI"]
NEO4J_USER = os.environ["NEO4J_USER"]
NEO4J_PASSWORD = os.environ["NEO4J_PASSWORD"]

RELATIONSHIPS_PATH = (
    "data/relationships/python_prerequisites_validated.json"
)

COURSE_CODE = "UE25CS151A"


def convert_topic_id(topic_id):
    """
    Convert mapper IDs (PY_001) to Neo4j service-layer IDs
    (UE25CS151A_001).
    """
    prefix, number = topic_id.rsplit("_", 1)
    return f"{COURSE_CODE}_{number}"


def main():
    with open(RELATIONSHIPS_PATH, encoding="utf-8") as f:
        relationships = json.load(f)

    driver = GraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USER, NEO4J_PASSWORD),
    )

    created = 0
    skipped = 0

    with driver.session() as session:
        for relationship in relationships:

            if relationship.get("validation_status") != "ACCEPTED":
                skipped += 1
                continue

            source = convert_topic_id(relationship["source"])
            target = convert_topic_id(relationship["target"])

            try:
                result = add_topic_prerequisite(
                    session,
                    source,
                    target,
                )

                created += 1

                print(
                    f"CREATED: {source} -> {target}"
                )

            except ValidationError as e:
                print(
                    f"SKIPPED: {source} -> {target} | {e}"
                )
                skipped += 1

    driver.close()

    print()
    print(f"Created: {created}")
    print(f"Skipped: {skipped}")


if __name__ == "__main__":
    main()