import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import CountUp from "react-countup";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./AdminDashboard.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

function AdminDashboard() {
  const [riskCount, setRiskCount] = useState(37);

  useEffect(() => {
    const interval = setInterval(() => {
      setRiskCount(Math.floor(Math.random() * 50) + 20);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const engagementData = [
    { month: "Jan", value: 45 },
    { month: "Feb", value: 52 },
    { month: "Mar", value: 60 },
    { month: "Apr", value: 48 },
    { month: "May", value: 70 },
    { month: "Jun", value: 82 },
  ];

  const industryData = [
    { name: "IT", value: 400 },
    { name: "Finance", value: 300 },
    { name: "Core", value: 200 },
    { name: "Startup", value: 150 },
  ];

  const registrationData = [
    { month: "Jan", users: 120 },
    { month: "Feb", users: 98 },
    { month: "Mar", users: 150 },
    { month: "Apr", users: 180 },
    { month: "May", users: 210 },
    { month: "Jun", users: 260 },
  ];

  const COLORS = ["#3b82f6", "#2563eb", "#1e3a8a", "#60a5fa"];

  const downloadPDF = () => {
    const input = document.getElementById("admin-dashboard");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
      pdf.save("Admin_Analytics_Report.pdf");
    });
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-main">
        <Topbar />

        <div className="dashboard-content" id="admin-dashboard">
          <h1>Admin Analytics Dashboard</h1>

          <button className="pdf-btn" onClick={downloadPDF}>
            Download Report
          </button>

          {/* Filters */}
          <div className="filter-bar">
            <select>
              <option>All Years</option>
              <option>2018</option>
              <option>2019</option>
              <option>2020</option>
            </select>

            <select>
              <option>All Departments</option>
              <option>CSE</option>
              <option>ECE</option>
              <option>ME</option>
            </select>
          </div>

          {/* KPI Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Alumni</h3>
              <p className="big-number">
                <CountUp end={1240} duration={2} />
              </p>
            </div>

            <div className="stat-card">
              <h3>Active Users</h3>
              <p className="big-number">
                <CountUp end={842} duration={2} />
              </p>
            </div>

            <div className="stat-card">
              <h3>Engagement Rate</h3>
              <p className="big-number">
                <CountUp end={48} duration={2} suffix="%" />
              </p>
            </div>

            <div className="stat-card alert-card">
              <h3>At-Risk Alumni</h3>
              <p className="big-number">
                <CountUp end={riskCount} duration={1.5} />
              </p>
            </div>
          </div>

          {/* Engagement Trend */}
          <h2 className="section-title">Engagement Trend</h2>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={engagementData}>
                <XAxis dataKey="month" stroke="#3b82f6" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Registrations */}
          <h2 className="section-title">Monthly Registrations</h2>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={registrationData}>
                <XAxis dataKey="month" stroke="#3b82f6" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Industry Distribution */}
          <h2 className="section-title">Industry Distribution</h2>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={industryData}
                  dataKey="value"
                  outerRadius={100}
                  label
                >
                  {industryData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insight */}
          <div className="ai-insight">
            ⚠ AI Alert: {riskCount} alumni show declining engagement
            probability. Proactive outreach recommended.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
