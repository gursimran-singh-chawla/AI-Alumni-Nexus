import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { api } from "../api";
import toast from "react-hot-toast";

export default function MockInterview() {
  const [setup, setSetup] = useState({ role: "Software Engineer", level: "entry" });
  const [session, setSession] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [allFeedback, setAllFeedback] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const startSession = async () => {
    setLoading(true);
    try {
      const data = await api.startInterview(setup);
      setSession(data); setCurrent(0); setAllFeedback([]); setFeedback(null); setAnswer(""); setShowResults(false);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return toast.error("Please provide an answer");
    if (evaluating || feedback) return;
    setEvaluating(true);
    try {
      const q = session.questions[current];
      const fb = await api.answerInterview({ question: q.q, answer });
      setFeedback(fb);
      setAllFeedback((prev) => [...prev, { question: q.q, answer, feedback: fb }]);
    } catch (e) { toast.error(e.message); }
    finally { setEvaluating(false); }
  };

  const next = () => {
    if (current < session.questions.length - 1) {
      setCurrent((c) => c + 1); setAnswer(""); setFeedback(null);
    }
  };

  const avgScore = allFeedback.length > 0 ? Math.round(allFeedback.reduce((s, f) => s + (f.feedback?.score || 0), 0) / allFeedback.length) : 0;
  const isFinished = session && showResults;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="AI Mock Interview" />
        <div className="page-content">
          {!session ? (
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <div className="card">
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎤</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>AI Mock Interview</div>
                  <p style={{ color: "var(--text3)", fontSize: 14 }}>Practice interview questions with instant AI feedback</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label>Target Role</label>
                    <input value={setup.role} onChange={(e) => setSetup({ ...setup, role: e.target.value })} placeholder="e.g. Software Engineer, Data Scientist..." />
                  </div>
                  <div className="form-group">
                    <label>Experience Level</label>
                    <select value={setup.level} onChange={(e) => setSetup({ ...setup, level: e.target.value })}>
                      <option value="entry">Entry Level (Fresher)</option>
                      <option value="mid">Mid Level (2-4 years)</option>
                      <option value="senior">Senior Level (5+ years)</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={startSession} disabled={loading}>
                    {loading ? "⏳ Preparing questions..." : "🚀 Start Interview"}
                  </button>
                </div>
              </div>
            </div>
          ) : isFinished ? (
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <div className="card" style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>Interview Complete!</div>
                <div style={{ fontSize: 48, fontWeight: 700, color: avgScore >= 7 ? "var(--success)" : avgScore >= 5 ? "var(--warning)" : "var(--danger)", margin: "16px 0" }}>
                  {avgScore}/10
                </div>
                <p style={{ color: "var(--text3)" }}>Average Score across {allFeedback.length} questions</p>
                <button className="btn btn-primary" style={{ margin: "16px auto 0", display: "flex" }} onClick={() => { setSession(null); setShowResults(false); }}>Try Again</button>
              </div>
              {allFeedback.map((item, i) => (
                <div className="card" key={i} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Q{i + 1}: {item.question}</div>
                  <div style={{ background: "var(--bg3)", borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 14, color: "var(--text2)" }}>Your answer: {item.answer}</div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: item.feedback?.score >= 7 ? "var(--success)" : "var(--warning)" }}>Score: {item.feedback?.score}/10</span>
                    <span style={{ fontSize: 13, color: "var(--text3)" }}>{item.feedback?.feedback}</span>
                  </div>
                  {item.feedback?.betterAnswer && <div style={{ fontSize: 13, color: "var(--text2)", borderLeft: "3px solid var(--primary)", paddingLeft: 12 }}>💡 {item.feedback.betterAnswer}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              {/* Progress */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {session.questions.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < current ? "var(--success)" : i === current ? "var(--primary)" : "var(--bg3)" }} />
                ))}
              </div>
              <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 16 }}>Question {current + 1} of {session.questions.length}</div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                  <span className={`badge ${session.questions[current]?.type === "technical" ? "badge-blue" : session.questions[current]?.type === "behavioral" ? "badge-green" : "badge-purple"}`}>
                    {session.questions[current]?.type}
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginBottom: 14 }}>{session.questions[current]?.q}</div>
                {session.questions[current]?.hint && (
                  <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, padding: 10, fontSize: 13, color: "var(--text3)" }}>
                    💡 Hint: {session.questions[current].hint}
                  </div>
                )}
              </div>

              <div className="card">
                <textarea rows={6} placeholder="Type your answer here... Take your time to think before answering." value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={evaluating || Boolean(feedback)} style={{ marginBottom: 12 }} />
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitAnswer} disabled={evaluating || Boolean(feedback) || !answer.trim()}>
                  {evaluating ? "⏳ Evaluating..." : feedback ? "Answer Evaluated ✓" : "Submit Answer"}
                </button>
              </div>

              {feedback && (
                <div className="card" style={{ marginTop: 16, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: feedback.score >= 7 ? "var(--success)" : feedback.score >= 5 ? "var(--warning)" : "var(--danger)" }}>
                      {feedback.score}/10
                    </div>
                    <div style={{ fontSize: 14, color: "var(--text2)" }}>{feedback.feedback}</div>
                  </div>
                  {feedback.betterAnswer && (
                    <div style={{ borderLeft: "3px solid var(--primary)", paddingLeft: 14, marginBottom: 14, fontSize: 14, color: "var(--text2)" }}>
                      <strong style={{ color: "var(--text)" }}>Better Answer:</strong><br />{feedback.betterAnswer}
                    </div>
                  )}
                  {current < session.questions.length - 1 && (
                    <button className="btn btn-primary" onClick={next}>Next Question →</button>
                  )}
                  {current === session.questions.length - 1 && (
                    <button className="btn btn-success" onClick={() => setShowResults(true)}>View Results 🏆</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
