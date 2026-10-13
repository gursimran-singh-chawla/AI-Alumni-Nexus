import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import { LayoutProvider } from "./context/LayoutContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AlumniDashboard from "./pages/AlumniDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Feed from "./pages/Feed";
import ChatPage from "./pages/ChatPage";
import SkillAnalyzer from "./pages/SkillAnalyzer";
import ResumeReview from "./pages/ResumeReview";
import MockInterview from "./pages/MockInterview";
import AlumniDirectory from "./pages/AlumniDirectory";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
import Mentorship from "./pages/Mentorship";
import Opportunities from "./pages/Opportunities";
import Notifications from "./pages/Notifications";

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <LayoutProvider>
        <Toaster position="top-right" toastOptions={{ style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" } }} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<PrivateRoute><AlumniDashboard /></PrivateRoute>} />
          <Route path="/adminDash" element={<PrivateRoute roles={["admin"]}><AdminDashboard /></PrivateRoute>} />
          <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
          <Route path="/chat/:roomId/:otherId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/ai/skills" element={<PrivateRoute><SkillAnalyzer /></PrivateRoute>} />
          <Route path="/ai/resume" element={<PrivateRoute><ResumeReview /></PrivateRoute>} />
          <Route path="/ai/mock" element={<PrivateRoute><MockInterview /></PrivateRoute>} />
          <Route path="/alumni" element={<PrivateRoute><AlumniDirectory /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
          <Route path="/mentorship" element={<PrivateRoute><Mentorship /></PrivateRoute>} />
          <Route path="/opportunities" element={<PrivateRoute><Opportunities /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        </Routes>
      </LayoutProvider>
    </BrowserRouter>
  );
}

export default App;
