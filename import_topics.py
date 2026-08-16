import json
import os

from dotenv import load_dotenv
from neo4j import GraphDatabase

from src.graph.services import create_topic, ValidationError

load_dotenv()

URI = os.environ["NEO4J_URI"]
USER = os.environ["NEO4J_USER"]
PASSWORD = os.environ["NEO4J_PASSWORD"]

with open("fixtures/python_mvp_7_topics/topics.json", "r") as f:
    data = json.load(f)

course_code = data["course"]["course_code"]

driver = GraphDatabase.driver(
    URI,
    auth=(USER, PASSWORD),
)

with driver.session() as session:
    for topic in data["topics"]:
        try:
            result = create_topic(
                session=session,
                course_code=course_code,
                name=topic["name"],
                unit=topic["unit"],
                description=topic["description"],
            )

            print(f"CREATED: {topic['name']}")

        except ValidationError as e:
            print(f"SKIPPED: {topic['name']} -> {e}")

driver.close()