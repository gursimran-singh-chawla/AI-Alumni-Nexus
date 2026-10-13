import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ax = axios.create({ baseURL: BASE, withCredentials: true });

const readStoredToken = () => localStorage.getItem("token");
const writeStoredToken = (token) => {
  if (token) localStorage.setItem("token", token);
};

ax.interceptors.request.use((cfg) => {
  const token = readStoredToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

ax.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const originalRequest = err.config;
    const status = err.response?.status;

    if (status === 401 && !originalRequest?._retry && !originalRequest?.url?.includes("/api/auth/")) {
      originalRequest._retry = true;
      try {
        const refresh = await ax.post("/api/auth/refresh", {});
        if (refresh?.token) {
          writeStoredToken(refresh.token);
          originalRequest.headers.Authorization = `Bearer ${refresh.token}`;
          return ax(originalRequest);
        }
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    const msg = err.response?.data?.message || "Something went wrong";
    return Promise.reject({ message: msg, status });
  }
);

export const api = {
  register: (d) => ax.post("/api/auth/register", d),
  login: (d) => ax.post("/api/auth/login", d),
  me: () => ax.get("/api/auth/me"),
  verifyCollegeEmail: (code) => ax.post("/api/auth/verify-college-email", { code }),
  resendCollegeVerification: () => ax.post("/api/auth/resend-college-verification"),
  logout: () => ax.post("/api/auth/logout", {}),

  getProfile: () => ax.get("/api/users/me"),
  updateProfile: (d) => ax.put("/api/users/me", d),
  getUser: (id) => ax.get(`/api/users/${id}`),
  getAlumni: (params) => ax.get("/api/users/alumni", { params }),
  getStudents: () => ax.get("/api/users/students"),
  getAllUsers: (params) => ax.get("/api/users/all", { params }),
  getUserStats: () => ax.get("/api/users/stats"),
  connect: (id) => ax.post(`/api/users/${id}/connect`),
  acceptConnect: (id) => ax.post(`/api/users/${id}/accept`),
  assignMentor: (studentId, mentorId) => ax.put(`/api/users/${studentId}/assign-mentor/${mentorId}`),
  changeRole: (id, role) => ax.put(`/api/users/${id}/role`, { role }),
  markNotifReadLegacy: () => ax.put("/api/users/me/notifications/read"),
  getAlumniVerifications: (params) => ax.get("/api/users/alumni-verifications", { params }),
  decideAlumniVerification: (id, decision, reason) => ax.put(`/api/users/alumni-verifications/${id}/decision`, { decision, reason }),

  getFeed: (page = 1, limit = 10) => ax.get(`/api/posts/feed?page=${page}&limit=${limit}`),
  createPost: (d) => ax.post("/api/posts", d),
  likePost: (id) => ax.put(`/api/posts/${id}/like`),
  commentPost: (id, text) => ax.post(`/api/posts/${id}/comment`, { text }),
  deletePost: (id) => ax.delete(`/api/posts/${id}`),
  getPostStats: () => ax.get("/api/posts/stats"),

  getMessages: (room, page = 1) => ax.get(`/api/messages/${encodeURIComponent(room)}?page=${page}&limit=30`),
  sendMessage: (d) => ax.post("/api/messages", d),
  getConversations: () => ax.get("/api/messages/conversations/list"),

  getEvents: (page = 1) => ax.get(`/api/events?page=${page}&limit=20`),
  createEvent: (d) => ax.post("/api/events", d),
  registerEvent: (id) => ax.post(`/api/events/${id}/register`),
  deleteEvent: (id) => ax.delete(`/api/events/${id}`),

  analyzeSkills: (skills) => ax.post("/api/ai/analyze-skills", { skills }),
  startInterview: (d) => ax.post("/api/ai/mock-interview/start", d),
  answerInterview: (d) => ax.post("/api/ai/mock-interview/answer", d),
  reviewResume: (resumeText) => ax.post("/api/ai/resume/review", { resumeText }),
  getRoadmap: (d) => ax.post("/api/ai/roadmap", d),

  getNotifications: (params) => ax.get("/api/notifications", { params }),
  markNotificationRead: (id) => ax.put(`/api/notifications/${id}/read`),
  markNotificationUnread: (id) => ax.put(`/api/notifications/${id}/unread`),
  markAllNotificationsRead: () => ax.put("/api/notifications/mark-all/read"),
  deleteNotification: (id) => ax.delete(`/api/notifications/${id}`),
  deleteNotificationsBatch: (ids) => ax.delete("/api/notifications/batch", { data: { ids } }),
  clearAllNotifications: () => ax.delete("/api/notifications/clear-all"),

  getMentors: (params) => ax.get("/api/mentorship/mentors", { params }),
  getMentorSuggestions: () => ax.get("/api/mentorship/suggestions"),
  updateMentorAvailability: (d) => ax.put("/api/mentorship/availability", d),
  requestMentorshipSession: (d) => ax.post("/api/mentorship/sessions/request", d),
  respondMentorshipSession: (id, d) => ax.put(`/api/mentorship/sessions/${id}/respond`, d),
  updateMentorshipSessionStatus: (id, status) => ax.put(`/api/mentorship/sessions/${id}/status`, { status }),
  submitSessionFeedback: (id, d) => ax.post(`/api/mentorship/sessions/${id}/feedback`, d),
  getMentorshipSessions: (params) => ax.get("/api/mentorship/sessions", { params }),

  getOpportunities: (params) => ax.get("/api/opportunities", { params }),
  createOpportunity: (d) => ax.post("/api/opportunities", d),
  applyOpportunity: (id, d) => ax.post(`/api/opportunities/${id}/apply`, d),
  deleteOpportunity: (id) => ax.delete(`/api/opportunities/${id}`),
  getMyPostedOpportunities: (params) => ax.get("/api/opportunities/mine/posted", { params }),
  getMyApplications: (params) => ax.get("/api/opportunities/mine/applications", { params }),
  getOpportunityApplications: (id, params) => ax.get(`/api/opportunities/${id}/applications`, { params }),
  updateOpportunityApplicationStatus: (applicationId, status) => ax.put(`/api/opportunities/applications/${applicationId}/status`, { status })
};
export default api;
