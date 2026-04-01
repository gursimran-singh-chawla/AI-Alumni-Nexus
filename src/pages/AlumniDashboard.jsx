import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import "./AlumniDashboard.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
function AlumniDashboard() {
  const data = [
    { month: "Jan", engagement: 45 },
    { month: "Feb", engagement: 52 },
    { month: "Mar", engagement: 60 },
    { month: "Apr", engagement: 48 },
    { month: "May", engagement: 70 },
    { month: "Jun", engagement: 82 },
  ];
  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-main">
        <Topbar />

        <div className="dashboard-content">
          <h1>Welcome Back, Prince 👑</h1>

          {/* Search Bar */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search Alumni by Name, Company..."
            />
          </div>
          {/* Overview Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Profile Completion</h3>
              <div className="progress-ring">75%</div>
            </div>

            <div className="stat-card">
              <h3>Engagement Score</h3>
              <p className="big-number">82</p>
              <span className="small-text">Above Average</span>
            </div>

            <div className="stat-card">
              <h3>Total Connections</h3>
              <p className="big-number">34</p>
            </div>
          </div>

          {/* AI Recommendation Section */}
          <h2 className="section-title">AI Recommended Connections</h2>
          <div className="card-row">
            <div className="mini-card">
              Rahul Sharma
              <span>Google • 2018 Batch</span>
            </div>

            <div className="mini-card">
              Ananya Singh
              <span>Microsoft • 2019 Batch</span>
            </div>

            <div className="mini-card">
              Vikram Mehta
              <span>Amazon • 2017 Batch</span>
            </div>
          </div>
          <h2 className="section-title">Engagement Trend</h2>

          <div className="chart-card">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <XAxis dataKey="month" stroke="#8884d8" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="#3b82f6"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Upcoming Events */}
          <h2 className="section-title">Upcoming Events</h2>
          <div className="card-row">
            <div className="mini-card event-card">
              <strong>Tech Alumni Meetup</strong>
              <span>25 March 2026</span>
            </div>

            <div className="mini-card event-card">
              <strong>AI Career Webinar</strong>
              <span>2 April 2026</span>
            </div>
          </div>

          {/* Activity Feed */}
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-feed">
            <div>✔ You connected with Rahul Sharma</div>
            <div>✔ You registered for AI Webinar</div>
            <div>✔ Profile updated successfully</div>
          </div>

          {/* AI Insight */}
          <div className="ai-insight">
            💡 AI Suggestion: Complete your profile to increase visibility by
            30%.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlumniDashboard;
