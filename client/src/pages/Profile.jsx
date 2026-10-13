import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import toast from "react-hot-toast";
import { getVerificationBadgeType } from "../utils/badgeHelper";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "", bio: user?.bio || "", college: user?.college || "",
    branch: user?.branch || "", year: user?.year || "", company: user?.company || "",
    jobRole: user?.jobRole || "", experience: user?.experience || 0, location: user?.location || "",
    github: user?.github || "", linkedin: user?.linkedin || "", leetcode: user?.leetcode || "",
    avatar: user?.avatar || "", mentorshipAvailability: user?.mentorshipAvailability || false,
    mentorAvailabilityStatus: user?.mentorAvailabilityStatus || "unavailable",
    emailNotificationEnabled: user?.emailNotificationEnabled || false,
  });
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState(user?.skills || []);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills((s) => [...s, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (sk) => setSkills((s) => s.filter((x) => x !== sk));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ ...form, skills });
      updateUser(updated.user);
      toast.success("Profile updated!");
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const pct = user?.profileComplete || 20;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="My Profile" />
        <div className="page-content">
          <div className="grid-2" style={{ gap: 24 }}>
            {/* Left: Profile Preview */}
            <div>
              <div className="card" style={{ marginBottom: 20, textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: form.avatar ? "none" : "linear-gradient(135deg,#3b82f6,#8b5cf6)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "white", overflow: "hidden" }}>
                  {form.avatar ? <img src={form.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : form.fullName?.[0]}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 12, marginBottom: 4, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>{form.fullName}</div>
                  <Badge type={getVerificationBadgeType(user?.verificationStatus === "verified")} size="small" />
                </div>
                <div style={{ color: "var(--text3)", fontSize: 14 }}>{user?.role}</div>
                {form.bio && <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 12, lineHeight: 1.6 }}>{form.bio}</p>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 14 }}>
                  {skills.map((sk) => <span key={sk} className="badge badge-blue">{sk}</span>)}
                </div>
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "var(--text3)" }}>Profile Complete</span>
                    <span style={{ fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                </div>
                {form.github && <a href={form.github} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>GitHub ↗</a>}
                {form.linkedin && <a href={form.linkedin} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: 8, marginLeft: 8 }}>LinkedIn ↗</a>}
              </div>
            </div>

            {/* Right: Edit Form */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 20 }}>Edit Profile</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group"><label>Full Name</label><input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></div>
                <div className="form-group"><label>Bio</label><textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Tell alumni about yourself..." /></div>
                <div className="form-group"><label>Avatar URL</label><input value={form.avatar} onChange={(e) => set("avatar", e.target.value)} placeholder="https://..." /></div>
                <div className="form-row">
                  <div className="form-group"><label>College</label><input value={form.college} onChange={(e) => set("college", e.target.value)} /></div>
                  <div className="form-group"><label>Branch</label><input value={form.branch} onChange={(e) => set("branch", e.target.value)} /></div>
                </div>
                {user?.role === "alumni" && (
                  <>
                    <div className="form-row">
                      <div className="form-group"><label>Company</label><input value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
                      <div className="form-group"><label>Job Role</label><input value={form.jobRole} onChange={(e) => set("jobRole", e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Experience (years)</label><input type="number" value={form.experience} onChange={(e) => set("experience", e.target.value)} /></div>
                      <div className="form-group"><label>Location</label><input value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
                    </div>
                    <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <input type="checkbox" checked={form.mentorshipAvailability} onChange={(e) => set("mentorshipAvailability", e.target.checked)} style={{ width: "auto" }} />
                      <label style={{ margin: 0 }}>Open to Mentorship</label>
                    </div>
                    <div className="form-group">
                      <label>Mentor Availability Status</label>
                      <select value={form.mentorAvailabilityStatus} onChange={(e) => set("mentorAvailabilityStatus", e.target.value)}>
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="form-row">
                  <div className="form-group"><label>GitHub</label><input value={form.github} onChange={(e) => set("github", e.target.value)} placeholder="https://github.com/..." /></div>
                  <div className="form-group"><label>LinkedIn</label><input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
                </div>
                <div className="form-group">
                  <label>Skills</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add skill (e.g. React)" onKeyDown={(e) => e.key === "Enter" && addSkill()} />
                    <button className="btn btn-outline" onClick={addSkill}>Add</button>
                  </div>
                  <div className="tags" style={{ marginTop: 8 }}>
                    {skills.map((sk) => (
                      <span key={sk} className="tag removable" onClick={() => removeSkill(sk)}>{sk}</span>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" checked={form.emailNotificationEnabled} onChange={(e) => set("emailNotificationEnabled", e.target.checked)} style={{ width: "auto" }} />
                  <label style={{ margin: 0 }}>Enable email notification hooks</label>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
