import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import toast from "react-hot-toast";

export default function SkillAnalyzer() {
  const { user } = useAuth();
  const [skills, setSkills] = useState(user?.skills || []);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roadmapForm, setRoadmapForm] = useState({ goal: "", currentSkills: skills.join(", "), timeframe: "6 months" });
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const addSkill = () => {
    if (input.trim() && !skills.includes(input.trim())) { setSkills((s) => [...s, input.trim()]); setInput(""); }
  };

  const analyze = async () => {
    if (!skills.length) return toast.error("Add at least one skill");
    setLoading(true);
    try { const data = await api.analyzeSkills(skills); setResult(data); }
    catch (e) { toast.error(e.message || "Analysis failed"); }
    finally { setLoading(false); }
  };

  const generateRoadmap = async () => {
    if (!roadmapForm.goal) return toast.error("Enter your career goal");
    setRoadmapLoading(true);
    try {
      const data = await api.getRoadmap({ goal: roadmapForm.goal, currentSkills: roadmapForm.currentSkills.split(",").map((s) => s.trim()), timeframe: roadmapForm.timeframe });
      setRoadmap(data);
    } catch (e) { toast.error(e.message || "Roadmap generation failed"); }
    finally { setRoadmapLoading(false); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="AI Skill Analyzer" />
        <div className="page-content">
          <div className="grid-2" style={{ gap: 24 }}>
            {/* Skill Input */}
            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="section-title" style={{ marginBottom: 16 }}>🧠 Analyze My Skills</div>
                <p style={{ color: "var(--text3)", fontSize: 14, marginBottom: 14 }}>Add your current skills and get AI-powered career insights.</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input placeholder="e.g. React, Python, SQL..." value={input}
                    onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} />
                  <button className="btn btn-outline" onClick={addSkill}>Add</button>
                </div>
                <div className="tags" style={{ marginBottom: 16 }}>
                  {skills.map((sk) => (
                    <span key={sk} className="tag removable" onClick={() => setSkills((s) => s.filter((x) => x !== sk))}>{sk}</span>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={analyze} disabled={loading || !skills.length}>
                  {loading ? "⏳ Analyzing..." : "🔍 Analyze Skills"}
                </button>
              </div>

              {/* Roadmap Form */}
              <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>🗺 Generate Learning Roadmap</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input placeholder="Career goal (e.g. Full Stack Developer, ML Engineer)" value={roadmapForm.goal} onChange={(e) => setRoadmapForm({ ...roadmapForm, goal: e.target.value })} />
                  <input placeholder="Current skills (comma-separated)" value={roadmapForm.currentSkills} onChange={(e) => setRoadmapForm({ ...roadmapForm, currentSkills: e.target.value })} />
                  <select value={roadmapForm.timeframe} onChange={(e) => setRoadmapForm({ ...roadmapForm, timeframe: e.target.value })}>
                    <option value="3 months">3 Months</option>
                    <option value="6 months">6 Months</option>
                    <option value="1 year">1 Year</option>
                  </select>
                  <button className="btn btn-primary" onClick={generateRoadmap} disabled={roadmapLoading || !roadmapForm.goal}>
                    {roadmapLoading ? "⏳ Generating..." : "🗺 Generate Roadmap"}
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div>
              {result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Salary & Demand */}
                  <div style={{ display: "flex", gap: 12 }}>
                    <div className="card" style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 6 }}>💰 Salary Range</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--success)" }}>{result.salaryRange || "₹8-25 LPA"}</div>
                    </div>
                    <div className="card" style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 6 }}>📈 Market Demand</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: result.marketDemand === "high" ? "var(--success)" : "var(--warning)" }}>
                        {result.marketDemand?.toUpperCase() || "HIGH"}
                      </div>
                    </div>
                  </div>

                  {/* Matching Roles */}
                  <div className="card">
                    <div className="section-title" style={{ marginBottom: 12 }}>🎯 Matching Career Roles</div>
                    {result.roles?.map((r) => (
                      <div key={r} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ color: "var(--primary)" }}>→</span>
                        <span style={{ fontWeight: 500 }}>{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Missing Skills */}
                  <div className="card">
                    <div className="section-title" style={{ marginBottom: 12 }}>⚠️ Skills to Learn</div>
                    <div className="tags">
                      {result.missingSkills?.map((sk) => <span key={sk} className="badge badge-yellow">{sk}</span>)}
                    </div>
                  </div>

                  {/* Roadmap */}
                  <div className="card">
                    <div className="section-title" style={{ marginBottom: 12 }}>📍 Recommended Steps</div>
                    {result.roadmap?.map((step, i) => (
                      <div key={i} style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ paddingTop: 4, fontSize: 14 }}>{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {roadmap && (
                <div className="card" style={{ marginTop: result ? 16 : 0 }}>
                  <div className="section-title" style={{ marginBottom: 16 }}>🗺 Your {roadmapForm.timeframe} Roadmap</div>
                  {roadmap.phases?.map((phase) => (
                    <div key={phase.phase} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{phase.phase}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{phase.title}</div>
                          <div style={{ fontSize: 12, color: "var(--text3)" }}>{phase.duration}</div>
                        </div>
                      </div>
                      <div style={{ paddingLeft: 44 }}>
                        <div className="tags" style={{ marginBottom: 8 }}>{phase.topics?.map((t) => <span key={t} className="badge badge-blue">{t}</span>)}</div>
                        {phase.resources?.length > 0 && <div style={{ fontSize: 13, color: "var(--text3)" }}>📚 {phase.resources.join(", ")}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!result && !roadmap && (
                <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                  <div>Add your skills and click "Analyze" to get AI-powered insights</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
