from src.graph import queries


class ValidationError(Exception):
    """Raised when a faculty operation violates a validation rule."""
    pass


def _generate_topic_id(session, course_code):
    """
    Generate the next topic ID for a course.

    Existing IDs follow the pattern:
    PY_001, PY_002, ...
    C_001, C_002, ...
    """

    topic_ids = queries.get_topic_ids_for_course(session, course_code)

    max_number = 0

    for topic_id in topic_ids:
        try:
            prefix, number = topic_id.rsplit("_", 1)

            # Only consider IDs belonging to this course's topic prefix.
            # For the current Python course this is PY.
            if number.isdigit():
                max_number = max(max_number, int(number))
        except ValueError:
            continue

    # Current project convention uses PY_001, PY_002, etc.
    # Derive the prefix from existing topic IDs.
    if topic_ids:
        try:
            prefix = topic_ids[0].rsplit("_", 1)[0]
        except (IndexError, AttributeError):
            prefix = course_code
    else:
        # No topics yet: derive prefix from the course code.
        prefix = course_code

    return f"{prefix}_{max_number + 1:03d}"


def create_topic(
    session,
    course_code,
    name,
    unit,
    description="",
):
    """Validate and create a new topic."""

    # Validate course
    if not queries.course_exists(session, course_code):
        raise ValidationError(
            f"Course '{course_code}' does not exist"
        )

    # Validate duplicate topic
    existing = queries.topic_exists_in_course(
        session,
        course_code,
        name,
    )

    if existing:
        raise ValidationError(
            f"Topic '{name}' already exists in course '{course_code}'"
        )

    # Generate ID automatically
    topic_id = _generate_topic_id(session, course_code)

    # Create topic
    return queries.create_topic(
        session,
        course_code,
        topic_id,
        name,
        unit,
        description,
    )


def add_topic_prerequisite(
    session,
    prerequisite_id,
    target_id,
):
    """Validate and create a topic prerequisite."""

    # Self prerequisite
    if prerequisite_id == target_id:
        raise ValidationError(
            "A topic cannot be its own prerequisite"
        )

    # Validate prerequisite topic
    if not queries.topic_exists(session, prerequisite_id):
        raise ValidationError(
            f"Topic '{prerequisite_id}' does not exist"
        )

    # Validate target topic
    if not queries.topic_exists(session, target_id):
        raise ValidationError(
            f"Topic '{target_id}' does not exist"
        )

    # Duplicate prerequisite
    if queries.topic_prerequisite_exists(
        session,
        prerequisite_id,
        target_id,
    ):
        raise ValidationError(
            "This topic prerequisite already exists"
        )

    # Cycle detection
    #
    # If target -> ... -> prerequisite already exists,
    # adding prerequisite -> target would create a cycle.
    if queries.topic_path_exists(
        session,
        target_id,
        prerequisite_id,
    ):
        raise ValidationError(
            "This prerequisite would create a cycle"
        )

    return queries.create_topic_prerequisite(
        session,
        prerequisite_id,
        target_id,
    )


def add_course_prerequisite(
    session,
    prerequisite_code,
    target_code,
):
    """Validate and create a course prerequisite."""

    # Self prerequisite
    if prerequisite_code == target_code:
        raise ValidationError(
            "A course cannot be its own prerequisite"
        )

    # Validate prerequisite course
    if not queries.course_exists(
        session,
        prerequisite_code,
    ):
        raise ValidationError(
            f"Course '{prerequisite_code}' does not exist"
        )

    # Validate target course
    if not queries.course_exists(
        session,
        target_code,
    ):
        raise ValidationError(
            f"Course '{target_code}' does not exist"
        )

    # Duplicate prerequisite
    if queries.course_prerequisite_exists(
        session,
        prerequisite_code,
        target_code,
    ):
        raise ValidationError(
            "This course prerequisite already exists"
        )

    # Cycle detection
    if queries.course_path_exists(
        session,
        target_code,
        prerequisite_code,
    ):
        raise ValidationError(
            "This prerequisite would create a cycle"
        )

    return queries.create_course_prerequisite(
        session,
        prerequisite_code,
        target_code,
    )