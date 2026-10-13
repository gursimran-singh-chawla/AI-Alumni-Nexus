import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api } from "../api";
import toast from "react-hot-toast";
import { getVerificationBadgeType, getOnlineBadgeType } from "../utils/badgeHelper";

export default function AlumniDirectory() {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMentor, setFilterMentor] = useState(false);
  const [connecting, setConnecting] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expertiseFilter, setExpertiseFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [yearsActiveFilter, setYearsActiveFilter] = useState("");

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const data = await api.getAlumni(params);
      setAlumni(data.data || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = () => load({ 
    search, 
    available: filterMentor || undefined, 
    expertise: expertiseFilter || undefined,
    location: locationFilter || undefined,
    yearsActive: yearsActiveFilter || undefined,
    page: 1, 
    limit: 50 
  });

  const handleConnect = async (id) => {
    setConnecting((c) => ({ ...c, [id]: true }));
    try {
      await api.connect(id);
      toast.success("Connection request sent!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setConnecting((c) => ({ ...c, [id]: false }));
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilterMentor(false);
    setExpertiseFilter("");
    setLocationFilter("");
    setYearsActiveFilter("");
    setShowAdvancedFilters(false);
    load();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Alumni Directory" />
        <div className="page-content">
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: showAdvancedFilters ? 16 : 0 }}>
              <input 
                placeholder="Search by name, company, skills..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handleSearch()} 
                style={{ flex: 1, minWidth: 240 }} 
              />
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text2)", fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={filterMentor} onChange={(e) => setFilterMentor(e.target.checked)} style={{ width: "auto" }} />
                Mentors only
              </label>
              <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
              <button className="btn btn-outline btn-sm" onClick={clearFilters}>Reset</button>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                style={{ marginBottom: 0 }}
              >
                {showAdvancedFilters ? "Hide Advanced" : "Advanced"}
              </button>
            </div>

            {showAdvancedFilters && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                    Expertise
                  </label>
                  <input 
                    placeholder="e.g., JavaScript, Python, ML"
                    value={expertiseFilter}
                    onChange={(e) => setExpertiseFilter(e.target.value)}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                    Location
                  </label>
                  <input 
                    placeholder="City or region"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                    Years Active
                  </label>
                  <select
                    value={yearsActiveFilter}
                    onChange={(e) => setYearsActiveFilter(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="0-2">0-2 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}><div className="spinner" style={{ margin: "auto" }} /></div>
          ) : alumni.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>No alumni found</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {alumni.map((a) => {
                const isConnected = user?.connections?.includes(a._id);
                const isOnline = onlineUsers?.includes(a._id);
                return (
                  <div className="card" key={a._id} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div className="avatar avatar-lg">{a.avatar ? <img src={a.avatar} alt="" /> : a.fullName?.[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{a.fullName}</div>
                          <Badge type={getVerificationBadgeType(a.verificationStatus === "verified")} size="small" />
                          <Badge type={getOnlineBadgeType(isOnline)} size="small" />
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text3)" }}>{a.jobRole} {a.company ? `@ ${a.company}` : ""}</div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>{a.college} · {a.experience ? `${a.experience}y exp` : ""}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          {a.mentorAvailabilityStatus === "available" && <span className="badge badge-green">Open to Mentor</span>}
                        </div>
                      </div>
                    </div>
                    {a.bio && <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>{a.bio.slice(0, 100)}{a.bio.length > 100 ? "..." : ""}</p>}
                    {a.skills?.length > 0 && <div className="tags">{a.skills.slice(0, 5).map((sk) => <span key={sk} className="tag">{sk}</span>)}</div>}
                    <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                      <Link to={`/chat/${[user._id, a._id].sort().join("_")}/${a._id}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: "center" }}>💬 Message</Link>
                      <button className={`btn btn-sm ${isConnected ? "btn-success" : "btn-primary"}`} style={{ flex: 1 }} onClick={() => !isConnected && handleConnect(a._id)} disabled={connecting[a._id] || isConnected}>
                        {isConnected ? "✓ Connected" : connecting[a._id] ? "..." : "Connect"}
                      </button>
                    </div>
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
