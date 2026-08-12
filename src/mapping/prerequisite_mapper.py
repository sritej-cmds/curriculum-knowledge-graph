import json
from pathlib import Path
from src.llm.client import GeminiClient

PROMPT_PATH = Path("prompts/prerequisite_mapping.txt")
TOPICS_PATH = Path("fixtures/c_mvp_10_topics/topics.json")
RAW_RELATIONSHIPS_PATH = Path(
    "data/relationships/c_prerequisites_raw.json"
)
VALIDATED_RELATIONSHIPS_PATH = Path(
    "data/relationships/c_prerequisites_validated.json"
)
MIN_CONFIDENCE = 0.70

def load_topics():
    """Load topic definitions from the golden fixture."""
    with open(TOPICS_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def load_prompt():
    """Load the prerequisite mapping prompt."""
    with open(PROMPT_PATH, "r", encoding="utf-8") as file:
        return file.read()


def build_prompt(topics):
    """Insert topic data into the prerequisite mapping prompt."""
    prompt_template = load_prompt()

    topics_json = json.dumps(
        topics,
        indent=2,
        ensure_ascii=False
    )

    return prompt_template.replace("{{TOPICS}}", topics_json)

def parse_llm_response(response):
    """Parse the LLM's JSON response into Python objects."""

    try:
        relationships = json.loads(response)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"LLM returned invalid JSON: {error}"
        ) from error

    if not isinstance(relationships, list):
        raise ValueError(
            "LLM response must be a JSON array."
        )

    return relationships


# VALIDATION

def validate_topic_ids(topics, relationships):
    """Check that source and target IDs exist in the topic list."""

    valid_topic_ids = {
        topic["topic_id"]
        for topic in topics
    }

    errors = []

    for index, relationship in enumerate(relationships):
        source = relationship.get("source")
        target = relationship.get("target")

        if source not in valid_topic_ids:
            errors.append(
                f"Relationship {index}: invalid source ID '{source}'"
            )

        if target not in valid_topic_ids:
            errors.append(
                f"Relationship {index}: invalid target ID '{target}'"
            )

    return errors


def validate_self_dependencies(relationships):
    """Check that a topic is not its own prerequisite."""

    errors = []

    for index, relationship in enumerate(relationships):
        source = relationship.get("source")
        target = relationship.get("target")

        if source == target:
            errors.append(
                f"Relationship {index}: self-dependency "
                f"'{source} -> {target}'"
            )

    return errors


def validate_relationship_fields(relationships):
    """Check that every relationship contains the required fields."""

    required_fields = {
        "source",
        "target",
        "relationship",
        "confidence",
        "reason",
        "validation_status"
    }

    errors = []

    for index, relationship in enumerate(relationships):
        missing = required_fields - relationship.keys()

        if missing:
            errors.append(
                f"Relationship {index}: missing fields "
                f"{sorted(missing)}"
            )

    return errors


def validate_relationship_type(relationships):
    """Check that relationships use the expected type."""

    errors = []

    for index, relationship in enumerate(relationships):
        if relationship.get("relationship") != "PREREQUISITE_OF":
            errors.append(
                f"Relationship {index}: invalid relationship type "
                f"'{relationship.get('relationship')}'"
            )

    return errors


def validate_confidence(relationships):
    """Check that confidence scores are between 0.0 and 1.0."""

    errors = []

    for index, relationship in enumerate(relationships):
        confidence = relationship.get("confidence")

        if not isinstance(confidence, (int, float)):
            errors.append(
                f"Relationship {index}: confidence must be a number"
            )
            continue

        if not 0.0 <= confidence <= 1.0:
            errors.append(
                f"Relationship {index}: confidence "
                f"{confidence} is outside 0.0-1.0"
            )

    return errors


def validate_status(relationships):
    """Check that raw relationships are still pending validation."""

    errors = []

    for index, relationship in enumerate(relationships):
        if relationship.get("validation_status") != "PENDING":
            errors.append(
                f"Relationship {index}: expected validation_status "
                f"'PENDING'"
            )

    return errors


def detect_cycles(relationships):
    """Detect cycles in the prerequisite graph."""

    graph = {}

    for relationship in relationships:
        source = relationship["source"]
        target = relationship["target"]

        graph.setdefault(source, []).append(target)

    visited = set()
    recursion_stack = set()

    def dfs(node):
        if node in recursion_stack:
            return True

        if node in visited:
            return False

        visited.add(node)
        recursion_stack.add(node)

        for neighbour in graph.get(node, []):
            if dfs(neighbour):
                return True

        recursion_stack.remove(node)

        return False

    for node in graph:
        if dfs(node):
            return True

    return False

def validate_duplicate_relationships(relationships):
    """Check for duplicate source-target prerequisite relationships."""

    seen = set()
    errors = []

    for index, relationship in enumerate(relationships):
        source = relationship.get("source")
        target = relationship.get("target")

        edge = (source, target)

        if edge in seen:
            errors.append(
                f"Relationship {index}: duplicate edge "
                f"'{source} -> {target}'"
            )
        else:
            seen.add(edge)

    return errors

def validate_confidence_threshold(relationships):
    """Reject relationships below the minimum confidence threshold."""

    errors = []

    for index, relationship in enumerate(relationships):
        confidence = relationship.get("confidence")

        if isinstance(confidence, (int, float)):
            if confidence < MIN_CONFIDENCE:
                errors.append(
                    f"Relationship {index}: confidence "
                    f"{confidence} is below minimum "
                    f"threshold {MIN_CONFIDENCE}"
                )

    return errors

#acceptance
def accept_relationships(relationships):
    """
    Mark structurally valid relationships as ACCEPTED.
    """

    accepted = []

    for relationship in relationships:
        relationship = relationship.copy()
        relationship["validation_status"] = "ACCEPTED"
        accepted.append(relationship)

    return accepted


def validate_relationships(topics, relationships):
    """
    Run all structural validations on prerequisite relationships.
    Returns a list of validation errors.
    """

    errors = []

    errors.extend(
        validate_topic_ids(topics, relationships)
    )

    errors.extend(
        validate_self_dependencies(relationships)
    )

    errors.extend(
        validate_relationship_fields(relationships)
    )

    errors.extend(
        validate_relationship_type(relationships)
    )

    errors.extend(
        validate_confidence(relationships)
    )

    errors.extend(
        validate_status(relationships)
    )

    errors.extend(
        validate_duplicate_relationships(relationships)
    )

    errors.extend(
        validate_confidence_threshold(relationships)
    )

    # Only perform cycle detection when the basic structure
    # is valid enough to safely construct the graph.
    if not errors:
        if detect_cycles(relationships):
            errors.append(
                "Cycle detected in prerequisite graph"
            )

    return errors


# MAIN

if __name__ == "__main__":
    topics = load_topics()

    # Build the reasoning prompt
    prompt = build_prompt(topics)

    # Generate candidate relationships
    llm = GeminiClient()
    response = llm.generate(prompt)

    # Parse LLM response
    relationships = parse_llm_response(response)

    # Validate relationships
    errors = validate_relationships(
        topics,
        relationships
    )

    if errors:
        print("Validation failed:")

        for error in errors:
            print(f"- {error}")

    else:
        accepted = accept_relationships(relationships)

        with open(
            VALIDATED_RELATIONSHIPS_PATH,
            "w",
            encoding="utf-8"
        ) as file:
            json.dump(
                accepted,
                file,
                indent=2,
                ensure_ascii=False
            )

        print(
            f"Validation successful. "
            f"Accepted {len(accepted)} relationships."
        )