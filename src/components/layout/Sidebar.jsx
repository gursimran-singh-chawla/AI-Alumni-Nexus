import { Link } from "react-router-dom";

function Sidebar() {
  const role = localStorage.getItem("role");

  return (
    <div className="sidebar">
      <h2 className="logo">AI Nexus</h2>

      <nav>
        {role === "alumni" && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="#">Connections</Link>
            <Link to="#">Events</Link>
            <Link to="#">Mentorship</Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link to="/adminDash">Admin Dashboard</Link>
            <Link to="#">Alumni Directory</Link>
            <Link to="#">Analytics</Link>
            <Link to="#">Event Management</Link>
          </>
        )}
        <Link to="/dashboard/feed">Feed</Link>

        <Link to="/login">Logout</Link>
      </nav>
    </div>
  );
}

export default Sidebar;
