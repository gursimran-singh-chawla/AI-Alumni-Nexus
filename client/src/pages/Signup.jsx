import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    college: "",
    branch: "",
    year: "",
    registrationNumber: "",
    passingYear: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome, ${user.fullName}! 🎉`);
      if (user.role === "alumni") {
        toast("Verify your college email and wait for admin approval to unlock alumni privileges.");
      }
      navigate(user.role === "admin" ? "/adminDash" : "/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ alignItems: "flex-start", paddingTop: 40 }}>
      <div className="particles">{[...Array(5)].map((_, i) => <span key={i} />)}</div>
      <div className="auth-left">
        <h1>Start Your <span className="auth-accent">Journey</span> Today</h1>
        <p>Join thousands of students and alumni building meaningful connections and accelerating careers.</p>
      </div>
      <div className="auth-right" style={{ maxWidth: 540 }}>
        <div className="auth-card">
          <h2>Create Account</h2>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Rahul Kumar" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="you@example.edu" value={form.email} onChange={(e) => set("email", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Min 6 chars" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={6} />
              </div>
            </div>
            <div className="form-group">
              <label>I am a</label>
              <select value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>
            <div className="form-group">
              <label>College / University</label>
              <input type="text" placeholder="IIT Delhi, NIT Warangal..." value={form.college} onChange={(e) => set("college", e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Branch</label>
                <input type="text" placeholder="CSE, ECE..." value={form.branch} onChange={(e) => set("branch", e.target.value)} />
              </div>
              <div className="form-group">
                <label>{form.role === "student" ? "Batch Year" : "Pass Out Year"}</label>
                <input type="text" placeholder="2025" value={form.year} onChange={(e) => set("year", e.target.value)} />
              </div>
            </div>
            {form.role === "alumni" && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Registration Number</label>
                    <input type="text" placeholder="COLL-REG-1234" value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Passing Year (Verification)</label>
                    <input type="text" placeholder="2022" value={form.passingYear} onChange={(e) => set("passingYear", e.target.value)} required />
                  </div>
                </div>
                <div style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", padding: 10, borderRadius: 8, fontSize: 12, color: "var(--text2)" }}>
                  Alumni verification requires: college email verification + admin approval.
                </div>
              </>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} disabled={loading}>
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>
          <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
        </div>
      </div>
    </div>
  );
}
