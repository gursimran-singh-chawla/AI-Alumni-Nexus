import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { api } from "../api";
import toast from "react-hot-toast";

export default function ResumeReview() {
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!resumeText.trim() || resumeText.length < 50) return toast.error("Please paste your resume content (min 50 characters)");
    setLoading(true);
    try { const data = await api.reviewResume(resumeText); setResult(data); }
    catch (e) { toast.error(e.message || "Review failed"); }
    finally { setLoading(false); }
  };

  const scoreColor = result ? result.score >= 80 ? "var(--success)" : result.score >= 60 ? "var(--warning)" : "var(--danger)" : "var(--primary)";

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="AI Resume Review" />
        <div className="page-content">
          <div className="grid-2" style={{ gap: 24 }}>
            {/* Input */}
            <div className="card">
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>AI Resume Analyzer</div>
                <p style={{ color: "var(--text3)", fontSize: 13 }}>Paste your resume text below for ATS optimization and scoring</p>
              </div>
              <textarea rows={16} placeholder={`Paste your full resume text here...\n\nExample:\nRahul Kumar\nrahul@email.com | 9876543210\nGitHub: github.com/rahul\n\nEDUCATION\nB.Tech Computer Science - IIT Delhi (2024)\nCGPA: 8.5/10\n\nSKILLS\nReact, Node.js, Python, MongoDB, AWS...\n\nPROJECTS\n...`}
                value={resumeText} onChange={(e) => setResumeText(e.target.value)} style={{ marginBottom: 16 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={analyze} disabled={loading || !resumeText.trim()}>
                  {loading ? "⏳ Analyzing..." : "🔍 Analyze Resume"}
                </button>
                <button className="btn btn-outline" onClick={() => { setResumeText(""); setResult(null); }}>Clear</button>
              </div>
              <p style={{ color: "var(--text3)", fontSize: 12, marginTop: 12 }}>⚠️ Do not include sensitive personal info. Text is analyzed by AI and not stored.</p>
            </div>

            {/* Results */}
            <div>
              {!result ? (
                <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                  Paste your resume and click Analyze to get detailed feedback
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Score */}
                  <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 8 }}>Overall Resume Score</div>
                    <div style={{ fontSize: 64, fontWeight: 800, color: scoreColor }}>{result.score}</div>
                    <div style={{ fontSize: 16, color: "var(--text3)", marginBottom: 14 }}>/100</div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${result.score}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}88)` }} /></div>
                    {result.summary && <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 14, lineHeight: 1.6 }}>{result.summary}</p>}
                  </div>

                  {/* Strengths */}
                  <div className="card">
                    <div className="section-title" style={{ marginBottom: 12, color: "var(--success)" }}>✅ Strengths</div>
                    {result.strengths?.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 14 }}>
                        <span style={{ color: "var(--success)" }}>✓</span> {s}
                      </div>
                    ))}
                  </div>

                  {/* Improvements */}
                  <div className="card">
                    <div className="section-title" style={{ marginBottom: 12, color: "var(--warning)" }}>⚠️ Areas to Improve</div>
                    {result.improvements?.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 14 }}>
                        <span style={{ color: "var(--warning)" }}>→</span> {s}
                      </div>
                    ))}
                  </div>

                  {/* ATS Keywords */}
                  <div className="card">
                    <div className="section-title" style={{ marginBottom: 12 }}>🔑 ATS Keywords to Add</div>
                    <div className="tags">
                      {result.atsKeywords?.map((kw) => <span key={kw} className="badge badge-purple">{kw}</span>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
