import { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import toast from "react-hot-toast";

export default function Opportunities() {
  const { user } = useAuth();
  const [opps, setOpps] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [myPosted, setMyPosted] = useState([]);
  const [selectedOppForReview, setSelectedOppForReview] = useState(null);
  const [oppApplications, setOppApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [filters, setFilters] = useState({ 
    search: "", 
    type: "", 
    location: "",
    applicationStatus: "",
    datePosted: ""
  });
  const [loading, setLoading] = useState(true);
  const [newOpp, setNewOpp] = useState({ title: "", description: "", type: "internship", company: "", location: "", skills: "" });

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const data = await api.getOpportunities({ page: 1, limit: 50, ...params });
      setOpps(data.data || []);
      if (user?.role === "student") {
        const apps = await api.getMyApplications({ page: 1, limit: 50 });
        setMyApps(apps.data || []);
      }
      if (user?.role === "alumni") {
        const posted = await api.getMyPostedOpportunities({ page: 1, limit: 50 });
        setMyPosted(posted.data || []);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const viewApplications = async (oppId) => {
    if (selectedOppForReview === oppId) {
      setSelectedOppForReview(null);
      return;
    }
    setSelectedOppForReview(oppId);
    setLoadingApps(true);
    try {
      const data = await api.getOpportunityApplications(oppId, { page: 1, limit: 50 });
      setOppApplications(data.data || []);
    } catch (e) {
      toast.error(e.message || "Failed to load applications");
    } finally {
      setLoadingApps(false);
    }
  };

  const updateAppStatus = async (appId, status) => {
    try {
      await api.updateOpportunityApplicationStatus(appId, status);
      toast.success(`Application marked as ${status}`);
      setOppApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, status } : a)));
    } catch (e) {
      toast.error(e.message || "Failed to update status");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const apply = async (id) => {
    try {
      await api.applyOpportunity(id, {});
      toast.success("Application submitted");
      load(filters);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const create = async () => {
    try {
      await api.createOpportunity({
        ...newOpp,
        skills: newOpp.skills.split(",").map((x) => x.trim()).filter(Boolean)
      });
      toast.success("Opportunity posted");
      setNewOpp({ title: "", description: "", type: "internship", company: "", location: "", skills: "" });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const hasApplied = (id) => myApps.some((a) => a.opportunity?._id === id || a.opportunity === id);
  const getApplicationStatus = (id) => myApps.find((a) => a.opportunity?._id === id || a.opportunity === id)?.status;

  // Apply filters
  const filteredOpps = useMemo(() => {
    return opps.filter((o) => {
      // Search filter (title and company)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!o.title.toLowerCase().includes(searchLower) && !o.company.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (filters.type && o.type !== filters.type) return false;

      // Location filter
      if (filters.location && !o.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Application status filter
      if (filters.applicationStatus && user?.role === "student") {
        const appStatus = getApplicationStatus(o._id);
        if (filters.applicationStatus === "applied" && !appStatus) return false;
        if (filters.applicationStatus === "not-applied" && appStatus) return false;
        if (appStatus && filters.applicationStatus !== "applied" && filters.applicationStatus !== appStatus) {
          // If filtering by specific status (reviewing, accepted, rejected)
          return appStatus === filters.applicationStatus;
        }
      }

      // Date posted filter
      if (filters.datePosted) {
        const now = Date.now();
        const postedTime = new Date(o.createdAt).getTime();
        const diffDays = (now - postedTime) / (1000 * 60 * 60 * 24);

        if (filters.datePosted === "today" && diffDays > 1) return false;
        if (filters.datePosted === "week" && diffDays > 7) return false;
        if (filters.datePosted === "month" && diffDays > 30) return false;
      }

      return true;
    });
  }, [opps, filters, myApps]);

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "",
      location: "",
      applicationStatus: "",
      datePosted: ""
    });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Opportunities" />
        <div className="page-content">
          {/* Filters */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Search
                </label>
                <input
                  placeholder="Search title/company"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">All types</option>
                  <option value="internship">Internship</option>
                  <option value="job">Job</option>
                  <option value="referral">Referral</option>
                  <option value="hackathon">Hackathon</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Location
                </label>
                <input
                  placeholder="Location"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />
              </div>

              {user?.role === "student" && (
                <>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                      Application
                    </label>
                    <select
                      value={filters.applicationStatus}
                      onChange={(e) => setFilters({ ...filters, applicationStatus: e.target.value })}
                    >
                      <option value="">All applications</option>
                      <option value="applied">Applied</option>
                      <option value="not-applied">Not applied</option>
                      <option value="reviewing">Under Review</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                      Date Posted
                    </label>
                    <select
                      value={filters.datePosted}
                      onChange={(e) => setFilters({ ...filters, datePosted: e.target.value })}
                    >
                      <option value="">All time</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                    </select>
                  </div>
                </>
              )}

              <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ marginBottom: 0 }}>
                Clear
              </button>
            </div>
          </div>

          {user?.role === "alumni" && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 10 }}>Post Opportunity</div>
              {user?.verificationStatus !== "verified" ? (
                <div style={{ color: "var(--warning)", fontSize: 13 }}>Only verified alumni can post opportunities.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  <input placeholder="Title" value={newOpp.title} onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })} />
                  <textarea rows={3} placeholder="Description" value={newOpp.description} onChange={(e) => setNewOpp({ ...newOpp, description: e.target.value })} />
                  <div className="form-row">
                    <select value={newOpp.type} onChange={(e) => setNewOpp({ ...newOpp, type: e.target.value })}>
                      <option value="internship">Internship</option>
                      <option value="job">Job</option>
                      <option value="referral">Referral</option>
                      <option value="hackathon">Hackathon</option>
                    </select>
                    <input placeholder="Company" value={newOpp.company} onChange={(e) => setNewOpp({ ...newOpp, company: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <input placeholder="Location" value={newOpp.location} onChange={(e) => setNewOpp({ ...newOpp, location: e.target.value })} />
                    <input placeholder="Skills comma separated" value={newOpp.skills} onChange={(e) => setNewOpp({ ...newOpp, skills: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" onClick={create}>Post Opportunity</button>
                </div>
              )}
            </div>
          )}

          {user?.role === "alumni" && myPosted.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 12 }}>My Posted Opportunities ({myPosted.length})</div>
              <div style={{ display: "grid", gap: 12 }}>
                {myPosted.map((p) => (
                  <div key={p._id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>{p.company} · {p.location} · {p.type}</div>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => viewApplications(p._id)}
                      >
                        {selectedOppForReview === p._id ? "Hide Applicants" : "Review Applicants"}
                      </button>
                    </div>

                    {selectedOppForReview === p._id && (
                      <div style={{ marginTop: 12, background: "var(--bg3)", borderRadius: 8, padding: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                          Applicants for {p.title}
                        </div>
                        {loadingApps ? (
                          <div style={{ fontSize: 12, color: "var(--text3)" }}>Loading applicants...</div>
                        ) : oppApplications.length === 0 ? (
                          <div style={{ fontSize: 12, color: "var(--text3)" }}>No applicants yet.</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {oppApplications.map((app) => (
                              <div
                                key={app._id}
                                style={{
                                  background: "var(--bg2)",
                                  padding: 10,
                                  borderRadius: 6,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: 8
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13 }}>{app.applicant?.fullName || "Applicant"}</div>
                                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                                    {app.applicant?.college} · {app.applicant?.branch} · Skills: {app.applicant?.skills?.join(", ") || "None"}
                                  </div>
                                  {app.coverLetter && (
                                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                                      "{app.coverLetter}"
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <Badge type={`opportunity-${app.status}`} size="small" />
                                  <select
                                    value={app.status}
                                    onChange={(e) => updateAppStatus(app._id, e.target.value)}
                                    style={{ width: "auto", minHeight: 32, padding: "4px 8px", fontSize: 12 }}
                                  >
                                    <option value="applied">Applied</option>
                                    <option value="reviewing">Reviewing</option>
                                    <option value="shortlisted">Shortlist</option>
                                    <option value="selected">Select</option>
                                    <option value="rejected">Reject</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}><div className="spinner" style={{ margin: "auto" }} /></div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredOpps.map((o) => {
                const appStatus = getApplicationStatus(o._id);
                return (
                  <div className="card" key={o._id}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 250 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 700 }}>{o.title}</div>
                          <Badge type={`opportunity-${appStatus || "not-applied"}`} size="small" />
                        </div>
                        <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 4 }}>
                          {o.company} · {o.location} · <span className="badge badge-blue">{o.type}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 8, marginBottom: 8 }}>{o.description}</p>
                        <div className="tags">{o.skills?.map((s) => <span className="tag" key={s}>{s}</span>)}</div>
                      </div>
                      {user?.role === "student" && (
                        appStatus
                          ? <button className="btn btn-success btn-sm" style={{ height: "fit-content" }}>Applied</button>
                          : <button className="btn btn-primary btn-sm" style={{ height: "fit-content" }} onClick={() => apply(o._id)}>Apply</button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredOpps.length === 0 && (
                <div className="card" style={{ textAlign: "center", color: "var(--text3)", padding: 40 }}>
                  {opps.length === 0 ? "No opportunities found." : "No opportunities match your filters."}
                </div>
              )}
            </div>
          )}

          {user?.role === "student" && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="section-title" style={{ marginBottom: 10 }}>My Applications</div>
              {myApps.length === 0 ? (
                <p style={{ color: "var(--text3)", fontSize: 13 }}>No applications yet.</p>
              ) : (
                myApps.map((a) => (
                  <div key={a._id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13 }}>{a.opportunity?.title}</span>
                    <Badge type={`opportunity-${a.status}`} size="small" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
