import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import Overview from "./pages/Overview";
import Curriculum from "./pages/Curriculum";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Topics from "./pages/Topics";
import TopicDetail from "./pages/TopicDetail";
import Prerequisites from "./pages/Prerequisites";
import KnowledgeGraph from "./pages/KnowledgeGraph";

export default function App() {
  return (
    <ToastProvider>
      <div className="flex min-h-svh bg-canvas">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseCode" element={<CourseDetail />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/topics/:topicId" element={<TopicDetail />} />
            <Route path="/prerequisites" element={<Prerequisites />} />
            <Route path="/graph" element={<KnowledgeGraph />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
