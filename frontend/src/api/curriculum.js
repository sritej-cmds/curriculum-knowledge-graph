import { http } from "./client";

// ---------- Health ----------

export function checkHealth() {
  return http.get("/health");
}

// ---------- Faculty write operations ----------

export function createTopic({ course_code, name, unit, description }) {
  return http.post("/topics", {
    course_code,
    name,
    unit,
    description,
  });
}

export function createTopicPrerequisite({
  prerequisite_topic_id,
  target_topic_id,
}) {
  return http.post("/topic-prerequisites", {
    prerequisite_topic_id,
    target_topic_id,
  });
}

export function createCoursePrerequisite({
  prerequisite_course_code,
  target_course_code,
}) {
  return http.post("/course-prerequisites", {
    prerequisite_course_code,
    target_course_code,
  });
}

// ---------- Topic relationships ----------

export function getTopicPrerequisites(topicId) {
  return http.get(
    `/topics/${encodeURIComponent(topicId)}/prerequisites`
  );
}

export function getTopicPrerequisiteChain(topicId) {
  return http.get(
    `/topics/${encodeURIComponent(topicId)}/prerequisite-chain`
  );
}

export function getTopicDownstream(topicId) {
  return http.get(
    `/topics/${encodeURIComponent(topicId)}/downstream`
  );
}

export function getTopicCentrality() {
  return http.get("/topics/centrality");
}

export function getStudentRemediation(studentId) {
  return http.get(
    `/students/${encodeURIComponent(studentId)}/remediation`
  );
}

// ---------- Curriculum browsing ----------

export function listSemesters() {
  return http.get("/semesters");
}

export function listCourses({ semester } = {}) {
  if (semester !== undefined && semester !== null) {
    return http.get(`/semesters/${semester}/courses`);
  }

  return http.get("/courses");
}

export function getCourse(courseCode) {
  return http.get(
    `/courses/${encodeURIComponent(courseCode)}`
  );
}

export function listTopicsForCourse(courseCode) {
  return http.get(
    `/courses/${encodeURIComponent(courseCode)}/topics`
  );
}

export function searchTopics(query) {
  return http.get(
    `/topics/search?q=${encodeURIComponent(query)}`
  );
}

export function getTopic(topicId) {
  return http.get(
    `/topics/${encodeURIComponent(topicId)}`
  );
}

export function getOverviewStats() {
  return http.get("/stats/overview");
}

export function getFullTopicGraph() {
  return http.get("/topics/graph");
}

export function getCoursePrerequisites(courseCode) {
  return http.get(
    `/courses/${encodeURIComponent(courseCode)}/prerequisites`
  );
}