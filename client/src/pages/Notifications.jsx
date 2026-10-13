import { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import Badge from "../components/Badge";
import { getNotificationBadgeType } from "../utils/badgeHelper";
import { api } from "../api";
import toast from "react-hot-toast";

// Notification type mapping
const NOTIFICATION_TYPES = {
  mention: "Mention",
  message: "Message",
  event: "Event",
  opportunity: "Opportunity",
  mentorship: "Mentorship",
  post: "Post",
  system: "System"
};

const NOTIFICATION_TYPE_COLORS = {
  mention: "🏷️",
  message: "💬",
  event: "📅",
  opportunity: "💼",
  mentorship: "🤝",
  post: "📰",
  system: "⚙️"
};

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    type: "",
    readStatus: "",
    dateRange: ""
  });

  // Preferences modal
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("notificationPreferences")) || {
        mention_enabled: true,
        message_enabled: true,
        event_enabled: true,
        opportunity_enabled: true,
        mentorship_enabled: true,
        post_enabled: true,
        system_enabled: true,
        sound_enabled: true,
        email_enabled: false
      };
    } catch {
      return {
        mention_enabled: true,
        message_enabled: true,
        event_enabled: true,
        opportunity_enabled: true,
        mentorship_enabled: true,
        post_enabled: true,
        system_enabled: true,
        sound_enabled: true,
        email_enabled: false
      };
    }
  });

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const mergedParams = { page: 1, limit: 100, ...params };
      const data = await api.getNotifications(mergedParams);
      setNotifications(data.data || []);
      setSelectedIds(new Set());
      setSelectAll(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Apply filters
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Type filter
      if (filters.type && n.type !== filters.type) return false;

      // Read status filter
      if (filters.readStatus === "read" && !n.read) return false;
      if (filters.readStatus === "unread" && n.read) return false;

      // Date range filter
      if (filters.dateRange) {
        const now = Date.now();
        const createdTime = new Date(n.createdAt).getTime();
        const diffDays = (now - createdTime) / (1000 * 60 * 60 * 24);

        if (filters.dateRange === "today" && diffDays > 1) return false;
        if (filters.dateRange === "week" && diffDays > 7) return false;
        if (filters.dateRange === "month" && diffDays > 30) return false;
      }

      return true;
    });
  }, [notifications, filters]);

  const toggleNotificationSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === filteredNotifications.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n._id)));
      setSelectAll(true);
    }
  };

  const toggleRead = async (n) => {
    try {
      if (n.read) await api.markNotificationUnread(n._id);
      else await api.markNotificationRead(n._id);
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: !x.read } : x)));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const markSelectedAsRead = async () => {
    if (selectedIds.size === 0) {
      toast.error("No notifications selected");
      return;
    }
    try {
      for (const id of selectedIds) {
        const n = notifications.find((x) => x._id === id);
        if (n && !n.read) await api.markNotificationRead(id);
      }
      setNotifications((prev) =>
        prev.map((x) => (selectedIds.has(x._id) ? { ...x, read: true } : x))
      );
      setSelectedIds(new Set());
      setSelectAll(false);
      toast.success(`Marked ${selectedIds.size} as read`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const markSelectedAsUnread = async () => {
    if (selectedIds.size === 0) {
      toast.error("No notifications selected");
      return;
    }
    try {
      for (const id of selectedIds) {
        const n = notifications.find((x) => x._id === id);
        if (n && n.read) await api.markNotificationUnread(id);
      }
      setNotifications((prev) =>
        prev.map((x) => (selectedIds.has(x._id) ? { ...x, read: false } : x))
      );
      setSelectedIds(new Set());
      setSelectAll(false);
      toast.success(`Marked ${selectedIds.size} as unread`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error("No notifications selected");
      return;
    }
    if (!confirm(`Delete ${selectedIds.size} notification(s)?`)) return;

    try {
      const idsArray = Array.from(selectedIds);
      await api.deleteNotificationsBatch(idsArray);
      setNotifications((prev) => prev.filter((x) => !selectedIds.has(x._id)));
      setSelectedIds(new Set());
      setSelectAll(false);
      toast.success(`Deleted ${idsArray.length} notification(s)`);
    } catch (e) {
      toast.error(e.message || "Could not delete selected notifications");
    }
  };

  const savePreferences = () => {
    localStorage.setItem("notificationPreferences", JSON.stringify(preferences));
    toast.success("Preferences saved");
    setShowPreferences(false);
  };

  const clearFilters = () => {
    setFilters({ type: "", readStatus: "", dateRange: "" });
    load();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Notification Center" />
        <div className="page-content">
          {/* Header */}
          <div className="section-header" style={{ marginBottom: 20, alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div className="section-title">In-app Notifications</div>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowPreferences(true)}
                title="Notification preferences"
              >
                ⚙️ Preferences
              </button>
              <button className="btn btn-outline btn-sm" onClick={markAllRead}>
                Mark all as read
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="">All types</option>
                  {Object.entries(NOTIFICATION_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Status
                </label>
                <select
                  value={filters.readStatus}
                  onChange={(e) => setFilters({ ...filters, readStatus: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="">All statuses</option>
                  <option value="read">Read</option>
                  <option value="unread">Unread</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="">All time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              </div>

              <button className="btn btn-outline btn-sm" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </div>

          {/* Batch Actions */}
          {selectedIds.size > 0 && (
            <div
              style={{
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: "var(--radius)",
                padding: 12,
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12
              }}
            >
              <div style={{ color: "var(--text2)", fontSize: 13, fontWeight: 500 }}>
                {selectedIds.size} selected
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-sm btn-outline" onClick={markSelectedAsRead}>
                  Mark as Read
                </button>
                <button className="btn btn-sm btn-outline" onClick={markSelectedAsUnread}>
                  Mark as Unread
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)", border: "none" }}
                  onClick={deleteSelected}
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div className="spinner" style={{ margin: "auto" }} />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="card" style={{ color: "var(--text3)", textAlign: "center", padding: 40 }}>
              {notifications.length === 0 ? "No notifications yet." : "No notifications match your filters."}
            </div>
          ) : (
            <div className="card">
              {/* Select All Checkbox */}
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  style={{ cursor: "pointer", width: 18, height: 18 }}
                />
                <span style={{ fontSize: 13, color: "var(--text2)" }}>
                  {selectAll ? "Deselect All" : "Select All"}
                </span>
              </div>

              {/* Notification Items */}
              {filteredNotifications.map((n) => (
                <div
                  key={n._id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    padding: "14px",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    background: selectedIds.has(n._id) ? "rgba(59,130,246,0.05)" : n.read ? "transparent" : "rgba(59,130,246,0.03)"
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(n._id)}
                    onChange={() => toggleNotificationSelect(n._id)}
                    style={{ cursor: "pointer", marginTop: 4, width: 18, height: 18 }}
                  />

                  {/* Icon & Type */}
                  <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                    {NOTIFICATION_TYPE_COLORS[n.type] || "📢"}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                      <Badge type={getNotificationBadgeType(n.read)} size="small" />
                      {n.type && (
                        <Badge
                          type={`notification-${n.type}`}
                          size="small"
                          label={NOTIFICATION_TYPES[n.type]}
                        />
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4, lineHeight: 1.5 }}>
                      {n.text}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => toggleRead(n)}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    {n.read ? "Unread" : "Read"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="modal-overlay" onClick={() => setShowPreferences(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Notification Preferences</h3>
              <button className="modal-close" onClick={() => setShowPreferences(false)}>
                ✕
              </button>
            </div>

            {/* Notification Type Toggles */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12 }}>
                Notification Types
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(NOTIFICATION_TYPES).map(([key, label]) => (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      fontSize: 13
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={preferences[`${key}_enabled`]}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          [`${key}_enabled`]: e.target.checked
                        })
                      }
                      style={{ cursor: "pointer" }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery Method */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12 }}>
                Delivery Preferences
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    fontSize: 13
                  }}
                >
                  <input
                    type="checkbox"
                    checked={preferences.sound_enabled}
                    onChange={(e) =>
                      setPreferences({ ...preferences, sound_enabled: e.target.checked })
                    }
                    style={{ cursor: "pointer" }}
                  />
                  <span>Sound notifications</span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    fontSize: 13
                  }}
                >
                  <input
                    type="checkbox"
                    checked={preferences.email_enabled}
                    onChange={(e) =>
                      setPreferences({ ...preferences, email_enabled: e.target.checked })
                    }
                    style={{ cursor: "pointer" }}
                  />
                  <span>Email notifications (coming soon)</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setShowPreferences(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={savePreferences}>
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
