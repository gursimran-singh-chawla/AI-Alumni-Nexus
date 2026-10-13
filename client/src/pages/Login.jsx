import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.fullName}!`);
      navigate(user.role === "admin" ? "/adminDash" : "/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="particles">
        {[...Array(5)].map((_, i) => <span key={i} />)}
      </div>
      <div className="auth-left">
        <h1>Connect. Learn. <span className="auth-accent">Grow.</span></h1>
        <p>AI Alumni Nexus bridges students with industry-leading alumni for mentorship, career guidance, and real-world insights.</p>
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}>
          {["🎓 Connect with 500+ Alumni", "🤖 AI-powered skill analysis", "💬 Real-time mentorship chat", "📄 Resume & interview prep"].map((f) => (
            <div key={f} style={{ color: "var(--text2)", fontSize: 15 }}>{f}</div>
          ))}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p style={{ textAlign: "center", color: "var(--text3)", fontSize: 14, marginBottom: 8 }}>Sign in to your account</p>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>
          <div className="auth-divider">or</div>
          <div style={{ background: "var(--bg3)", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "var(--text2)" }}>
            <strong>Demo Accounts:</strong><br />
            Admin: admin@nexus.com / admin123<br />
            Alumni: alumni@nexus.com / alumni123<br />
            Student: student@nexus.com / student123
          </div>
          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
