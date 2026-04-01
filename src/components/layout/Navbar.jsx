import { Link } from "react-router-dom";
import "./Navbar.css";
function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">AI Alumni Nexus</div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup" className="nav-btn">
          Get Started
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
