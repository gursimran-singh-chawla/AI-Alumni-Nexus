import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Fake role logic (temporary)
    const role = formData.email.includes("admin") ? "admin" : "alumni";

    localStorage.setItem("role", role);

    if (role === "admin") {
      navigate("/adminDash");
    } else {
      navigate("/dashboard");
    }
  };
  return (
    <div className="auth-page">
      {/* Floating Particles */}
      <div className="particles">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Left Branding */}
      <div className="auth-left">
        <h1>
          Welcome Back to <span className="accent">AI Alumni Nexus</span>
        </h1>
        <p>Continue building intelligent alumni connections and insights.</p>
      </div>

      {/* Right Form */}
      <div className="auth-right">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Login</h2>

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <div className="social-login">
            <button type="button" className="social-btn google-btn">
              Continue with Google
            </button>

            <button type="button" className="social-btn linkedin-btn">
              Continue with LinkedIn
            </button>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <button type="submit" className="btn-primary">
            Login
          </button>

          <p className="switch-link">
            Don’t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
