import { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import toast from "react-hot-toast";

const TYPE_COLORS = { webinar: "badge-blue", meetup: "badge-green", workshop: "badge-purple", hackathon: "badge-yellow" };

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    api.getEvents(1).then((d) => setEvents(d.data || [])).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const handleRegister = async (id) => {
    setRegistering((r) => ({ ...r, [id]: true }));
    try {
      const data = await api.registerEvent(id);
      setEvents((ev) => ev.map((e) => (e._id === id ? { ...e, registrations: [...(e.registrations || []), user._id] } : e)));
      toast.success(`Registered! ${data.count} total registrations`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRegistering((r) => ({ ...r, [id]: false }));
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (search && !e.title?.toLowerCase().includes(search.toLowerCase()) && !e.location?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (typeFilter && e.type !== typeFilter) return false;
      const isPast = new Date(e.date) < new Date();
      if (statusFilter === "upcoming" && isPast) return false;
      if (statusFilter === "past" && !isPast) return false;
      return true;
    });
  }, [events, search, typeFilter, statusFilter]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Events & Webinars" />
        <div className="page-content">
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Campus Events & Webinars</h2>
            <p style={{ color: "var(--text3)" }}>Join webinars, workshops and meetups organized by alumni and campus clubs</p>
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                Search Events
              </label>
              <input
                placeholder="Search by title or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ width: 150 }}>
              <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                Event Type
              </label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="webinar">Webinar</option>
                <option value="meetup">Meetup</option>
                <option value="workshop">Workshop</option>
                <option value="hackathon">Hackathon</option>
              </select>
            </div>
            <div style={{ width: 140 }}>
              <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                Status
              </label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => { setSearch(""); setTypeFilter(""); setStatusFilter("all"); }}>
              Reset
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}><div className="spinner" style={{ margin: "auto" }} /></div>
          ) : filteredEvents.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>
              {events.length === 0 ? "No events scheduled yet." : "No events match your search criteria."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {filteredEvents.map((e) => {
                const registered = e.registrations?.includes(user?._id);
                const isPast = new Date(e.date) < new Date();
                return (
                  <div className="card" key={e._id}>
                    <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                      <div style={{ background: "rgba(59,130,246,0.1)", borderRadius: 12, padding: "12px 16px", textAlign: "center", minWidth: 60 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)" }}>{new Date(e.date).getDate()}</div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>{new Date(e.date).toLocaleString("default", { month: "short" })}</div>
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>{new Date(e.date).getFullYear()}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{e.title}</div>
                        <span className={`badge ${TYPE_COLORS[e.type] || "badge-blue"}`}>{e.type}</span>
                      </div>
                    </div>
                    {e.description && <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginBottom: 14 }}>{e.description}</p>}
                    <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text3)", marginBottom: 14 }}>
                      <span>📍 {e.location}</span>
                      <span>🕐 {new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span>👥 {e.registrations?.length || 0} registered</span>
                    </div>
                    {isPast ? (
                      <div className="btn btn-outline btn-sm" style={{ textAlign: "center", color: "var(--text3)" }}>Event Ended</div>
                    ) : registered ? (
                      <div className="btn btn-success btn-sm" style={{ width: "100%", justifyContent: "center" }}>✓ Registered</div>
                    ) : (
                      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => handleRegister(e._id)} disabled={registering[e._id]}>
                        {registering[e._id] ? "Registering..." : "Register Now"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
