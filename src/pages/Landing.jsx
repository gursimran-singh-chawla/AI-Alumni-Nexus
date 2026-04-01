import Navbar from "../components/layout/Navbar";
import { Link } from "react-router-dom";

function Landing() {
  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <h1>
          Reimagining Alumni Engagement <br />
          <span className="accent">with Intelligent AI Systems</span>
        </h1>
        <p>
          Centralized records, real-time synchronization, predictive analytics,
          and hybrid AI recommendations.
        </p>
        <div className="hero-buttons">
          <Link to="/signup" className="btn-primary">
            Join as Alumni
          </Link>
          <Link to="/login" className="btn-outline">
            Admin Login
          </Link>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section dark-card">
        <h2>Traditional Alumni Systems Are Broken</h2>
        <div className="grid">
          <div>Fragmented Data Across Departments</div>
          <div>Low Engagement (8–15%)</div>
          <div>Manual Spreadsheet Updates</div>
          <div>No Predictive Analytics</div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <h2>AI Alumni Nexus Solution</h2>
        <div className="grid">
          <div className="card">
            <h3>Centralized Cloud Platform</h3>
            <p>Unified alumni records with scalable infrastructure.</p>
          </div>
          <div className="card">
            <h3>Hybrid Recommendation Engine</h3>
            <p>Smart mentor and connection matching using AI.</p>
          </div>
          <div className="card">
            <h3>Predictive Engagement Analytics</h3>
            <p>Forecast alumni activity and churn risks.</p>
          </div>
          <div className="card">
            <h3>Role-Based Secure Access</h3>
            <p>Enterprise-grade security with encrypted communication.</p>
          </div>
        </div>
      </section>

      {/* Architecture Preview */}
      <section className="section architecture">
        <h2>System Architecture Overview</h2>

        <div className="architecture-flow">
          <div className="arch-box">User Interface</div>
          <div className="arrow">→</div>
          <div className="arch-box">Application Layer</div>
          <div className="arrow">→</div>
          <div className="arch-box">AI/ML Engine</div>
          <div className="arrow">→</div>
          <div className="arch-box">Cloud Database</div>
        </div>
      </section>

      {/* Dual Audience */}
      <section className="section split">
        <div>
          <h3 className="accent">For Alumni</h3>
          <ul>
            <li>Mentorship Matching</li>
            <li>Career Opportunities</li>
            <li>Smart Event Notifications</li>
            <li>Professional Networking</li>
          </ul>
        </div>
        <div>
          <h3 className="accent">For Institutions</h3>
          <ul>
            <li>Engagement Analytics Dashboard</li>
            <li>Churn Prediction Models</li>
            <li>Centralized Alumni Records</li>
            <li>Data-Driven Strategic Decisions</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Join the Future of Alumni Engagement</h2>
        <Link to="/signup" className="btn-primary">
          Get Started
        </Link>
      </section>

      <footer className="footer">
        © 2026 AI Alumni Nexus | Built by Prince Raj
      </footer>
    </div>
  );
}

export default Landing;
