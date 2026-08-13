// Run this once against a fresh database, before loading any data.
// Constraints double as indexes and make MERGE-based loading safe (no duplicates).

CREATE CONSTRAINT topic_id_unique IF NOT EXISTS
FOR (t:Topic) REQUIRE t.topic_id IS UNIQUE;

CREATE CONSTRAINT subject_name_unique IF NOT EXISTS
FOR (s:Subject) REQUIRE s.name IS UNIQUE;

CREATE CONSTRAINT student_id_unique IF NOT EXISTS
FOR (st:Student) REQUIRE st.id IS UNIQUE;
