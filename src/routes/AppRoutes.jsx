import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import AlumniDashboard from "../pages/AlumniDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import Feed from "../pages/Feed";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<AlumniDashboard />} />
        <Route path="/adminDash" element={<AdminDashboard />} />
        <Route path="/dashboard/feed" element={<Feed />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
