# Backend endpoints this UI needs but doesn't have yet

The brief for this frontend explicitly said not to invent data or fake
backend behavior. The endpoints below are referenced from
`src/api/curriculum.js` (they throw `EndpointNotAvailableError`, and
the UI renders an honest "backend endpoint needed" state instead of
placeholder data) but don't exist on the FastAPI backend today.

## 1. `GET /semesters`
List every semester and its courses, for the Curriculum tree.

```json
[
  { "number": 1, "courses": [{ "course_code": "UE25CS151A", "name": "Python for Computational Problem Solving" }] }
]
```

## 2. `GET /courses` (and/or `GET /semesters/{number}/courses`)
List courses, optionally filtered by semester. Powers the Courses page.

```json
[{ "course_code": "UE25CS151A", "name": "Python for Computational Problem Solving", "semester": 1 }]
```

## 3. `GET /courses/{course_code}`
Course detail: name, semester, topics, and course-level prerequisites.
Powers the Course Detail page.

```json
{
  "course_code": "UE25CS151A",
  "name": "Python for Computational Problem Solving",
  "semester": 1,
  "topics": [{ "topic_id": "PY_001", "name": "Python Programming Fundamentals", "unit": 1 }],
  "prerequisite_courses": ["UE25CS101A"]
}
```

## 4. `GET /courses/{course_code}/topics`
Topics contained in one course. Could substitute for #3's `topics` field
if course detail and topic listing stay separate.

## 5. `GET /topics` and/or `GET /topics/search?q=`
List/search all topics — powers the Topics table and any topic-picker
dropdown (currently faculty must type a known topic ID by hand).

```json
[{ "topic_id": "PY_027", "name": "Decorators", "unit": 4, "course_code": "UE25CS151A" }]
```

## 6. `GET /topics/{topic_id}`
Single topic detail — name, unit, description. Right now the Topic
Detail page can only show prerequisites/chain/downstream because
that's all the existing three GET endpoints return.

```json
{ "topic_id": "PY_027", "name": "Decorators", "unit": 4, "description": "..." }
```

## 7. `GET /stats/overview`
Counts for the Overview dashboard.

```json
{ "semesters": 8, "courses": 42, "topics": 610, "relationships": 934 }
```

## 8. `GET /topics/graph` (or `GET /courses/{course_code}/graph`)
Full topic-prerequisite graph (nodes + edges) in one call. Today the
Knowledge Graph page builds this incrementally, node by node, using
the three existing per-topic endpoints — real data, but requires a
click per node to expand. A bulk endpoint would let the page render
the whole graph (or a whole course's graph) immediately.

```json
{
  "nodes": [{ "id": "PY_001", "name": "Python Programming Fundamentals" }],
  "edges": [{ "source": "PY_001", "target": "PY_027" }]
}
```

## 9. `GET /courses/{course_code}/prerequisites`
Course-level prerequisite list, for the Course Detail page's
"Course prerequisites" section.

---

None of these were invented into the running UI — see
`src/api/curriculum.js` for where each is stubbed, and
`EndpointNeededState` in `src/components/ui.jsx` for how the UI
surfaces the gap to faculty.
