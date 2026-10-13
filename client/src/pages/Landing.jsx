import { Link } from "react-router-dom";

const FEATURES = [
  { icon: "🤖", title: "AI Skill Analyzer", desc: "Get personalized skill gap analysis and career roadmaps powered by AI." },
  { icon: "🎤", title: "Mock Interviews", desc: "Practice with AI-generated interview questions and get instant feedback." },
  { icon: "🎓", title: "Alumni Mentorship", desc: "Connect directly with alumni mentors at top companies like Google, Amazon." },
  { icon: "💬", title: "Real-time Chat", desc: "Instant messaging with socket-powered real-time conversations." },
  { icon: "📄", title: "Resume Review", desc: "AI-powered resume scoring, ATS optimization and improvement tips." },
  { icon: "📅", title: "Events & Webinars", desc: "Join exclusive alumni events, workshops and industry webinars." },
];

export default function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <h2 style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700, fontSize: 22 }}>Alumni Nexus</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>
      <div className="landing-hero" style={{ position: "relative" }}>
        <div className="particles">{[...Array(5)].map((_,i) => <span key={i} />)}</div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <span className="badge badge-blue" style={{ marginBottom: 16, display: "inline-block" }}>✨ AI-Powered Alumni Platform</span>
          <h1>
            Bridge Students & Alumni<br />
            <span className="hero-gradient">With the Power of AI</span>
          </h1>
          <p>The complete platform for career mentorship, skill development, and professional networking — built for Indian colleges.</p>
          <div className="hero-btns">
            <Link to="/signup" className="btn btn-primary" style={{ fontSize: 16, padding: "14px 32px" }}>Get Started Free →</Link>
            <Link to="/login" className="btn btn-outline" style={{ fontSize: 16, padding: "14px 32px" }}>Sign In</Link>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 48, color: "var(--text3)", fontSize: 14 }}>
            {["500+ Alumni", "50+ Colleges", "AI-Powered", "Free to Use"].map((s) => (
              <div key={s} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>✅</div>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="features-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
