import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { api } from "../api";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "", location: "Online", type: "webinar" });

  const load = async () => {
    setLoading(true);
    try {
      const [s, u, v, ev] = await Promise.all([
        api.getUserStats(),
        api.getAllUsers({ page: 1, limit: 200 }),
        api.getAlumniVerifications({ status: "pending", page: 1, limit: 100 }),
        api.getEvents(1)
      ]);
      setStats(s);
      setUsers(u.data || []);
      setPendingVerifications(v.data || []);
      setEvents(ev.data || []);
    } catch (e) {
      toast.error("Failed to load dashboard: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (id, role) => {
    try {
      await api.changeRole(id, role);
      setUsers((u) => u.map((x) => (x._id === id ? { ...x, role } : x)));
      toast.success("Role updated");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const decideVerification = async (id, decision) => {
    const reason = decision === "rejected" ? prompt("Rejection reason") || "" : "";
    try {
      await api.decideAlumniVerification(id, decision, reason);
      setPendingVerifications((p) => p.filter((x) => x._id !== id));
      toast.success(`Alumni ${decision}`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.date) return toast.error("Title and date required");
    try {
      const evt = await api.createEvent(newEvent);
      setEvents((e) => [...e, evt]);
      setNewEvent({ title: "", description: "", date: "", location: "Online", type: "webinar" });
      toast.success("Event created");
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const TABS = ["overview", "users", "verification", "events"];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Admin Dashboard" />
        <div className="page-content">
          <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-outline"}`} style={{ textTransform: "capitalize" }}>{t}</button>
            ))}
          </div>

          {tab === "overview" && (
            <>
              <div className="stats-grid">
                {[
                  { label: "Total Users", value: stats?.totalUsers || 0, icon: "👥" },
                  { label: "Alumni", value: stats?.alumni || 0, icon: "🎓" },
                  { label: "Students", value: stats?.students || 0, icon: "📚" },
                  { label: "Mentors Available", value: stats?.mentorsAvailable || 0, icon: "🤝" },
                  { label: "Pending Verifications", value: stats?.pendingAlumniVerifications || 0, icon: "⏳" }
                ].map((s) => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="section-title" style={{ marginBottom: 10 }}>Top Skills</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats?.topSkills?.map((s) => ({ name: s._id, count: s.count })) || []}>
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {tab === "users" && (
            <div className="card" style={{ overflowX: "auto" }}>
              <table className="table">
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Verification</th><th>Change Role</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.role === "alumni" ? u.verificationStatus : "-"}</td>
                      <td>
                        <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)}>
                          <option value="student">Student</option>
                          <option value="alumni">Alumni</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "verification" && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Pending Alumni Verification Requests</div>
              {pendingVerifications.length === 0 ? <p style={{ color: "var(--text3)", fontSize: 14 }}>No pending requests.</p> : pendingVerifications.map((u) => (
                <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>{u.email} · Reg: {u.registrationNumber} · Passing: {u.passingYear}</div>
                    <div style={{ fontSize: 12, color: u.emailVerified ? "var(--success)" : "var(--warning)" }}>
                      Email verification: {u.emailVerified ? "completed" : "pending"}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-success" onClick={() => decideVerification(u._id, "verified")}>Approve</button>
                  <button className="btn btn-sm btn-danger" onClick={() => decideVerification(u._id, "rejected")}>Reject</button>
                </div>
              ))}
            </div>
          )}

          {tab === "events" && (
            <div className="grid-2" style={{ gap: 20 }}>
              <div className="card">
                <div className="section-title" style={{ marginBottom: 12 }}>Create Event</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <input placeholder="Event title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                  <textarea rows={3} placeholder="Description" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
                  <input type="datetime-local" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
                  <input placeholder="Location" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />
                  <select value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}>
                    <option value="webinar">Webinar</option>
                    <option value="meetup">Meetup</option>
                    <option value="workshop">Workshop</option>
                    <option value="hackathon">Hackathon</option>
                  </select>
                  <button className="btn btn-primary" onClick={createEvent}>Create Event</button>
                </div>
              </div>
              <div className="card">
                <div className="section-title" style={{ marginBottom: 12 }}>All Events ({events.length})</div>
                {events.map((e) => (
                  <div key={e._id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10, marginBottom: 10 }}>
                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>{new Date(e.date).toLocaleString()} · {e.location}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
