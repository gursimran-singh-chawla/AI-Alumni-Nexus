import { useState } from "react";
import { Link } from "react-router-dom";
import "./Signup.css";
function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    graduationYear: "",
    department: "",
    role: "alumni",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Signup UI Ready. Backend Later 🔥");
  };

  return (
    <div className="auth-page">
      {/* Left Branding Section */}
      <div className="particles">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="auth-left">
        <h1>
          AI Alumni <span className="accent">Nexus</span>
        </h1>
        <p>
          Empowering Alumni. Enabling Institutions.
          <br />
          Intelligent connections powered by AI.
        </p>
      </div>

      {/* Right Form Section */}
      <div className="auth-right">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Create Account</h2>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            required
          />

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

          <input
            type="text"
            name="graduationYear"
            placeholder="Graduation Year"
            onChange={handleChange}
          />

          <input
            type="text"
            name="department"
            placeholder="Department"
            onChange={handleChange}
          />

          <select name="role" onChange={handleChange}>
            <option value="alumni">Alumni</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit" className="btn-primary">
            Create Account
          </button>

          <div className="social-login">
            <button type="button" className="social-btn google-btn">
              <svg
                width="18"
                height="18"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12
        s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 29 4 24 4
        12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20
        c0-1.3-.1-2.7-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.5 16 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 29 4 24 4
        16.3 4 9.7 8.4 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.3 0 10.2-2 13.8-5.2l-6.4-5.2C29.3 35.7 26.8 36 24 36
        c-5.4 0-9.9-3.1-11.4-7.6l-6.6 5.1C9.6 39.6 16.3 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.7-6.8 7.1l6.4 5.2C38.7 36.7 44 31 44 24
        c0-1.3-.1-2.7-.4-3.5z"
                />
              </svg>
              Continue with Google
            </button>

            <button type="button" className="social-btn linkedin-btn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M4.98 3.5C4.98 5 3.88 6 2.5 6S0 5 0 3.5 1.1 1 2.5 1 4.98 2 4.98 3.5zM.5 8h4v14h-4zM8 8h3.6v1.9h.1c.5-.9 1.8-1.9 3.8-1.9 4.1 0 4.9 2.7 4.9 6.2V22h-4v-6.6c0-1.6 0-3.6-2.2-3.6-2.2 0-2.5 1.7-2.5 3.5V22H8z" />
              </svg>
              Continue with LinkedIn
            </button>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>
          <p className="switch-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
