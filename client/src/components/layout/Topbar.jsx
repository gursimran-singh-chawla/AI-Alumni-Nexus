import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLayout } from "../../context/LayoutContext";
import { api } from "../../api";

export default function Topbar({ title }) {
  const { user } = useAuth();
  const { toggleSidebar } = useLayout();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications({ page: 1, limit: 8 });
      setNotifications(data.data || []);
      setUnread(data.unreadCount || 0);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadNotifications();
  };

  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button className="hamburger-menu" onClick={toggleSidebar} title="Toggle menu">
          ☰
        </button>
        <div className="topbar-title">{title}</div>
      </div>
      <div className="topbar-right">
        <div style={{ position: "relative" }}>
          <button className="notif-btn" onClick={handleOpen}>
            🔔
            {unread > 0 && <span className="notif-badge">{unread}</span>}
          </button>
          {open && (
            <div className="notif-dropdown">
              {notifications.length === 0 ? (
                <div className="notif-item">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div key={n._id} className="notif-item" style={{ background: n.read ? "transparent" : "rgba(59,130,246,0.08)" }}>
                    <strong style={{ color: "var(--text)", fontSize: 12 }}>{n.title}</strong>
                    <div>{n.text}</div>
                  </div>
                ))
              )}
              <Link to="/notifications" className="notif-item" style={{ textDecoration: "none", color: "var(--primary)", textAlign: "center", fontWeight: 600 }} onClick={() => setOpen(false)}>
                Open Notification Center
              </Link>
            </div>
          )}
        </div>
        <div className="avatar avatar-sm">{user?.avatar ? <img src={user.avatar} alt="" /> : user?.fullName?.[0]?.toUpperCase()}</div>
      </div>
    </div>
  );
}
