import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import toast from "react-hot-toast";

function VerificationBanner({ user, refreshMe }) {
  const [code, setCode] = useState("");
  if (user?.role !== "alumni") return null;
  if (user.verificationStatus === "verified") return <span className="badge badge-green">✅ Verified Alumni</span>;

  const verifyEmail = async () => {
    try {
      await api.verifyCollegeEmail(code);
      toast.success("College email verified. Awaiting admin approval.");
      refreshMe();
      setCode("");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const resend = async () => {
    try {
      await api.resendCollegeVerification();
      toast.success("Verification code sent");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 20, borderColor: "rgba(245,158,11,0.35)" }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Alumni Verification: {user.verificationStatus}</div>
      {!user.emailVerified ? (
        <>
          <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 10 }}>Verify your college email to move ahead.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter 6-digit verification code" />
            <button className="btn btn-primary btn-sm" onClick={verifyEmail}>Verify</button>
            <button className="btn btn-outline btn-sm" onClick={resend}>Resend</button>
          </div>
        </>
      ) : (
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Email verified. Awaiting admin approval for full alumni access.</p>
      )}
      {user.verificationStatus === "rejected" && user.verificationRejectionReason && (
        <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>Reason: {user.verificationRejectionReason}</p>
      )}
    </div>
  );
}

export default function AlumniDashboard() {
  const { user, refreshMe } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getFeed(1),
      api.getAlumni({ available: true, page: 1, limit: 4 }),
      api.getEvents(1),
      user?.mentor ? api.getUser(user.mentor) : Promise.resolve(null)
    ])
      .then(([feed, alum, evts, mentorData]) => {
        setRecentPosts(feed.posts?.slice(0, 3) || []);
        setAlumni(alum?.data?.slice(0, 4) || []);
        setEvents(evts?.data?.slice(0, 3) || []);
        setMentor(mentorData);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Dashboard" />
        <div className="page-content">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Hey, {user?.fullName?.split(" ")[0]} 👋</h1>
            <p style={{ color: "var(--text3)", marginTop: 4 }}>Welcome back to your alumni network</p>
          </div>

          <VerificationBanner user={user} refreshMe={refreshMe} />

          <div className="stats-grid" style={{ marginBottom: 28 }}>
            {[
              { label: "Connections", value: user?.connections?.length || 0, icon: "🤝", sub: "Network size" },
              { label: "Profile Score", value: `${user?.profileComplete || 20}%`, icon: "📊", sub: "Completeness" },
              { label: "Events", value: events.length, icon: "📅", sub: "Available" },
              { label: "Alumni Network", value: `${alumni.length}+`, icon: "🎓", sub: "Mentors available" }
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ gap: 24 }}>
            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700 }}>{user?.fullName}</div>
                <div style={{ color: "var(--text3)", fontSize: 13 }}>{user?.role} · {user?.company || user?.college}</div>
                <div style={{ marginTop: 8 }}>
                  {user?.role === "alumni" && (
                    <span className={`badge ${user?.verificationStatus === "verified" ? "badge-green" : user?.verificationStatus === "rejected" ? "badge-red" : "badge-yellow"}`}>
                      {user?.verificationStatus}
                    </span>
                  )}
                </div>
              </div>

              {user?.role === "student" && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>👨‍🏫 Your Mentor</div>
                  {!mentor ? <p style={{ color: "var(--text3)", fontSize: 13 }}>No mentor assigned yet.</p> : (
                    <>
                      <div style={{ fontWeight: 600 }}>{mentor.fullName}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>{mentor.company}</div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="section-header">
                  <div className="section-title">📰 Recent Posts</div>
                  <Link to="/feed" className="btn btn-outline btn-sm">View Feed</Link>
                </div>
                {recentPosts.map((p) => (
                  <div key={p._id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.author?.fullName}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>{p.content?.slice(0, 100)}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="section-header">
                  <div className="section-title">📅 Upcoming Events</div>
                  <Link to="/events" className="btn btn-outline btn-sm">All Events</Link>
                </div>
                {events.length === 0 ? <p style={{ color: "var(--text3)", fontSize: 13 }}>No events scheduled.</p> : events.map((e) => (
                  <div key={e._id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10, marginBottom: 10 }}>
                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                    <div style={{ color: "var(--text3)", fontSize: 12 }}>{e.location} · {new Date(e.date).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
