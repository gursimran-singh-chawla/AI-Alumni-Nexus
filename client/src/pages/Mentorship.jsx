import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import toast from "react-hot-toast";

export default function Mentorship() {
  const { user, refreshMe } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [slot, setSlot] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("");
  const [method, setMethod] = useState("in_app");
  const [agenda, setAgenda] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState(user?.mentorAvailabilityStatus || "unavailable");
  
  // Filters
  const [filters, setFilters] = useState({
    status: "",
    expertise: ""
  });

  const load = async () => {
    try {
      const [m, s, sug] = await Promise.all([
        api.getMentors({ page: 1, limit: 30, availabilityStatus: "available" }),
        api.getMentorshipSessions({ page: 1, limit: 30 }),
        api.getMentorSuggestions()
      ]);
      setMentors(m.data || []);
      setSessions(s.data || []);
      setSuggestions(sug.data || []);
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => ({
    requested: sessions.filter((s) => s.status === "requested"),
    upcoming: sessions.filter((s) => ["upcoming", "accepted"].includes(s.status)),
    completed: sessions.filter((s) => s.status === "completed"),
    cancelled: sessions.filter((s) => ["cancelled", "rejected"].includes(s.status))
  }), [sessions]);

  // Apply filters to sessions
  const filteredGrouped = useMemo(() => {
    const filtered = { requested: [], upcoming: [], completed: [], cancelled: [] };
    
    Object.entries(grouped).forEach(([key, items]) => {
      filtered[key] = items.filter((s) => {
        if (filters.status && key !== filters.status) return false;
        return true;
      });
    });
    
    return filtered;
  }, [grouped, filters]);

  // Filter mentors by expertise
  const filteredMentors = useMemo(() => {
    if (!filters.expertise) return mentors;
    const expertiseLower = filters.expertise.toLowerCase();
    return mentors.filter((m) =>
      m.expertise?.some((e) => e.toLowerCase().includes(expertiseLower)) ||
      m.skills?.some((s) => s.toLowerCase().includes(expertiseLower))
    );
  }, [mentors, filters.expertise]);

  const requestSession = async () => {
    if (!selectedMentor || !slot) return toast.error("Select mentor and time slot");
    try {
      await api.requestMentorshipSession({ mentorId: selectedMentor, requestedSlot: slot, communicationMethod: method, agenda });
      toast.success("Mentorship session requested");
      setAgenda("");
      setSlot("");
      setSelectedMentor("");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const respond = async (sessionId, decision) => {
    try {
      await api.respondMentorshipSession(sessionId, { decision, scheduledAt: slot || undefined });
      toast.success(`Session ${decision}ed`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const updateStatus = async (sessionId, status) => {
    try {
      await api.updateMentorshipSessionStatus(sessionId, status);
      toast.success("Session updated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submitFeedback = async (sessionId) => {
    const rating = Number(prompt("Rate this session (1-5)") || 0);
    const comment = prompt("Any feedback?") || "";
    if (!rating || rating < 1 || rating > 5) return;
    try {
      await api.submitSessionFeedback(sessionId, { rating, comment });
      toast.success("Feedback submitted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const saveAvailability = async () => {
    try {
      await api.updateMentorAvailability({ mentorAvailabilityStatus: availabilityStatus, preferredCommunicationMethods: ["in_app", "email", "video_call"] });
      await refreshMe();
      toast.success("Availability updated");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const clearFilters = () => {
    setFilters({ status: "", expertise: "" });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Mentorship" />
        <div className="page-content">
          <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Book Mentorship Session</div>
              
              {/* Expertise Filter */}
              <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                Filter by Expertise
              </label>
              <input
                type="text"
                placeholder="e.g., JavaScript, Data Science, UI/UX"
                value={filters.expertise}
                onChange={(e) => setFilters({ ...filters, expertise: e.target.value })}
                style={{ marginBottom: 10 }}
              />

              <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                Select Mentor
              </label>
              <select value={selectedMentor} onChange={(e) => setSelectedMentor(e.target.value)}>
                <option value="">Select mentor ({filteredMentors.length})</option>
                {filteredMentors.map((m) => <option key={m._id} value={m._id}>{m.fullName} · {m.company || "N/A"}</option>)}
              </select>
              <input type="datetime-local" value={slot} onChange={(e) => setSlot(e.target.value)} style={{ marginTop: 10 }} />
              <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ marginTop: 10 }}>
                <option value="in_app">In-app Chat</option>
                <option value="email">Email</option>
                <option value="video_call">Video call</option>
              </select>
              <textarea rows={3} placeholder="Agenda" value={agenda} onChange={(e) => setAgenda(e.target.value)} style={{ marginTop: 10 }} />
              <button className="btn btn-primary" style={{ marginTop: 10, width: "100%" }} onClick={requestSession}>Request Session</button>

              <div style={{ marginTop: 16, fontSize: 13, color: "var(--text2)" }}>
                <strong>Smart suggestions:</strong>
                <div className="tags" style={{ marginTop: 8 }}>
                  {suggestions.map((s) => <span key={s._id} className="tag">{s.fullName} · {s.branch || "General"}</span>)}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Mentor Availability</div>
              {user?.role !== "alumni" ? (
                <p style={{ color: "var(--text3)", fontSize: 14 }}>Only alumni can set mentor availability.</p>
              ) : user?.verificationStatus !== "verified" ? (
                <p style={{ color: "var(--warning)", fontSize: 14 }}>You need verified alumni status to become an active mentor.</p>
              ) : (
                <>
                  <select value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value)}>
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                  <button className="btn btn-primary" style={{ marginTop: 10, width: "100%" }} onClick={saveAvailability}>Save Availability</button>
                </>
              )}
            </div>
          </div>

          {/* Session Status Filter */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Session Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All sessions</option>
                  <option value="requested">Requested (Pending)</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button className="btn btn-outline btn-sm" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            {Object.entries(filteredGrouped).map(([k, items]) => (
              <div className="card" key={k}>
                <div className="section-title" style={{ marginBottom: 10, textTransform: "capitalize" }}>{k} ({items.length})</div>
                {items.length === 0 ? (
                  <div style={{ color: "var(--text3)", fontSize: 13 }}>No sessions</div>
                ) : (
                  items.map((s) => {
                    const isMentor = s.mentor?._id === user?._id || s.mentor === user?._id;
                    return (
                      <div key={s._id} style={{ borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{isMentor ? s.mentee?.fullName : s.mentor?.fullName}</div>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                          {new Date(s.scheduledAt || s.requestedSlot).toLocaleString()} · {s.communicationMethod}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          <Badge type={`mentorship-${s.status}`} size="small" />
                          {isMentor && s.status === "requested" && (
                            <>
                              <button className="btn btn-sm btn-primary" onClick={() => respond(s._id, "accept")}>Accept</button>
                              <button className="btn btn-sm btn-outline" onClick={() => respond(s._id, "reject")}>Reject</button>
                            </>
                          )}
                          {s.status === "upcoming" && <button className="btn btn-sm btn-outline" onClick={() => updateStatus(s._id, "completed")}>Complete</button>}
                          {s.status === "upcoming" && <button className="btn btn-sm btn-outline" onClick={() => updateStatus(s._id, "cancelled")}>Cancel</button>}
                          {s.status === "completed" && !s.feedback?.rating && !isMentor && <button className="btn btn-sm btn-outline" onClick={() => submitFeedback(s._id)}>Rate</button>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
