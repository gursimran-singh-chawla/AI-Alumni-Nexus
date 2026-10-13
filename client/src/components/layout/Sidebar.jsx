import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLayout } from "../../context/LayoutContext";

const NAV = [
  { to: "/dashboard", icon: "🏠", label: "Dashboard" },
  { to: "/feed", icon: "📰", label: "Feed" },
  { to: "/alumni", icon: "🎓", label: "Alumni Directory" },
  { to: "/mentorship", icon: "🤝", label: "Mentorship" },
  { to: "/opportunities", icon: "💼", label: "Opportunities" },
  { to: "/events", icon: "📅", label: "Events" },
  { to: "/chat/general/0", icon: "💬", label: "Messages" },
  { to: "/notifications", icon: "🔔", label: "Notifications" },
  { to: "/ai/skills", icon: "🧠", label: "Skill Analyzer" },
  { to: "/ai/mock", icon: "🎤", label: "Mock Interview" },
  { to: "/ai/resume", icon: "📄", label: "Resume Review" },
  { to: "/profile", icon: "👤", label: "My Profile" }
];

const ADMIN_NAV = [{ to: "/adminDash", icon: "⚙️", label: "Admin Panel" }];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useLayout();

  const nav = user?.role === "admin" ? [...NAV, ...ADMIN_NAV] : NAV;
  const verificationText =
    user?.role !== "alumni"
      ? user?.role
      : user?.verificationStatus === "verified"
        ? "verified alumni"
        : `${user?.verificationStatus || "pending"} alumni`;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
      />
      
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "active" : ""}`}>
        <div className="sidebar-logo">
          <h2>Alumni Nexus</h2>
          <span>AI-Powered Network</span>
        </div>
        <nav>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={closeSidebar}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user" onClick={logout} title="Logout">
            <div className="avatar avatar-sm">{user?.avatar ? <img src={user.avatar} alt="" /> : user?.fullName?.[0]?.toUpperCase()}</div>
            <div className="sidebar-user-info">
              <div className="name">{user?.fullName}</div>
              <div className="role-badge">{verificationText} · Logout</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
