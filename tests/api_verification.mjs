// Comprehensive End-to-End API Test Suite for AI Alumni Nexus
// Exercises Auth, Roles, Mentorship, Opportunities, Feed, Notifications, Events, and AI Stubs

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

const assert = (condition, message) => {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    testsFailed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
};

const req = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = text;
  }
  return { status: res.status, ok: res.ok, body: json };
};

const runSuite = async () => {
  console.log(`\n🚀 Starting AI Alumni Nexus Comprehensive Verification Suite against ${BASE_URL}\n`);

  // 1. Root Healthcheck
  console.log("--- 1. System Healthcheck ---");
  const health = await req("/");
  assert(health.status === 200 && health.body?.status === "ok", "GET / returns status ok");

  // 2. Authentication & Authorization
  console.log("\n--- 2. Authentication & Credentials ---");
  
  // Bad credentials
  const badLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@nexus.com", password: "wrongpassword" })
  });
  assert(badLogin.status === 400, "Login rejects invalid password with HTTP 400");

  // Admin login
  const adminLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@nexus.com", password: "admin123" })
  });
  assert(adminLogin.status === 200 && adminLogin.body?.token, "Admin login succeeds and returns JWT");
  const adminToken = adminLogin.body.token;

  // Alumni login
  const alumniLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "alumni@nexus.com", password: "alumni123" })
  });
  assert(alumniLogin.status === 200 && alumniLogin.body?.token, "Alumni login succeeds and returns JWT");
  const alumniToken = alumniLogin.body.token;
  const alumniId = alumniLogin.body.user._id;

  // Student login
  const studentLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "student@nexus.com", password: "student123" })
  });
  assert(studentLogin.status === 200 && studentLogin.body?.token, "Student login succeeds and returns JWT");
  const studentToken = studentLogin.body.token;
  const studentId = studentLogin.body.user._id;

  // 3. User Profiles & Role Guards
  console.log("\n--- 3. User Profiles & Role Protection ---");
  const adminMe = await req("/api/users/me", {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminMe.status === 200 && adminMe.body.role === "admin", "Admin profile retrieved with role: admin");

  const unauthMe = await req("/api/users/me");
  assert(unauthMe.status === 401, "GET /api/users/me without token correctly returns HTTP 401");

  const adminStats = await req("/api/users/stats", {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminStats.status === 200 && typeof adminStats.body.totalUsers === "number", "Admin can access /api/users/stats aggregation");

  const studentStatsBlocked = await req("/api/users/stats", {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentStatsBlocked.status === 403, "Student is forbidden (HTTP 403) from /api/users/stats");

  // 4. Alumni Registration & College Email Logic
  console.log("\n--- 4. Alumni Registration & Domain Verification ---");
  const testAlumniEmail = `test.alumni.${Date.now()}@alumni.iitd.ac.in`;
  const regAlumni = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: "Test Alum IITD",
      email: testAlumniEmail,
      password: "password123",
      role: "alumni",
      college: "IIT Delhi",
      branch: "CSE",
      year: "2021",
      registrationNumber: "2017CS10999",
      passingYear: "2021"
    })
  });
  assert(regAlumni.status === 201 && regAlumni.body.user.verificationStatus === "pending", "Alumni registration requires college domain and defaults to pending");

  // Non-college email for alumni should fail
  const regInvalidAlumni = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: "Fake Alum",
      email: "fakealum@gmail.com",
      password: "password123",
      role: "alumni",
      registrationNumber: "12345",
      passingYear: "2020"
    })
  });
  assert(regInvalidAlumni.status === 400, "Alumni registration rejects non-academic domain emails (gmail.com)");

  // 5. Mentorship Lifecycle Workflow
  console.log("\n--- 5. Mentorship Lifecycle Workflow ---");
  const mentorsList = await req("/api/mentorship/mentors", {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(mentorsList.status === 200 && Array.isArray(mentorsList.body.data), "Student can query verified mentors list");

  // Student requests mentorship session
  const sessionReq = await req("/api/mentorship/sessions/request", {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      mentorId: alumniId,
      requestedSlot: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      communicationMethod: "in_app",
      agenda: "Guidance on backend microservices architecture and mock interview"
    })
  });
  assert(sessionReq.status === 201 && sessionReq.body._id, "Student successfully books mentorship request");
  const sessionId = sessionReq.body._id;

  // Alumni accepts the session
  const sessionAccept = await req(`/api/mentorship/sessions/${sessionId}/respond`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${alumniToken}` },
    body: JSON.stringify({
      decision: "accept",
      videoCallLink: "https://meet.google.com/abc-defg-hij"
    })
  });
  assert(sessionAccept.status === 200 && sessionAccept.body.session?.status === "upcoming", "Alumni accepts session, moving state to 'upcoming'");

  // Mark session completed
  const sessionComplete = await req(`/api/mentorship/sessions/${sessionId}/status`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${alumniToken}` },
    body: JSON.stringify({ status: "completed" })
  });
  assert(sessionComplete.status === 200 && sessionComplete.body.session?.status === "completed", "Session marked completed");

  // Mentee leaves feedback
  const feedbackRes = await req(`/api/mentorship/sessions/${sessionId}/feedback`, {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ rating: 5, comment: "Outstanding session! Clear architectural advice." })
  });
  assert(feedbackRes.status === 200 && feedbackRes.body.session?.feedback?.rating === 5, "Mentee successfully submits 5-star rating and feedback");

  // 6. Opportunity & Referral Lifecycle
  console.log("\n--- 6. Opportunities & Applications Workflow ---");
  const oppCreate = await req("/api/opportunities", {
    method: "POST",
    headers: { Authorization: `Bearer ${alumniToken}` },
    body: JSON.stringify({
      title: "Backend SWE Intern (Summer 2027)",
      description: "Join Google Core Infrastructure team. Experience with distributed systems and Go/Node required.",
      type: "internship",
      company: "Google",
      location: "Bengaluru / Hybrid",
      skills: ["Node.js", "System Design", "MongoDB"]
    })
  });
  assert(oppCreate.status === 201 && oppCreate.body._id, "Verified Alumni posts new internship opportunity");
  const opportunityId = oppCreate.body._id;

  // Student searches and applies
  const oppQuery = await req("/api/opportunities?search=Backend", {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(oppQuery.status === 200 && oppQuery.body.data.some((o) => o._id === opportunityId), "Student searches and finds the newly posted opportunity");

  const applyRes = await req(`/api/opportunities/${opportunityId}/apply`, {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      coverLetter: "Strong background in Node.js and distributed systems. Built full-stack apps."
    })
  });
  assert(applyRes.status === 201 && applyRes.body.status === "applied", "Student applies to opportunity with status 'applied'");
  const applicationId = applyRes.body._id;

  // Alumni views applicants for their posted opportunity
  const oppApps = await req(`/api/opportunities/${opportunityId}/applications`, {
    headers: { Authorization: `Bearer ${alumniToken}` }
  });
  assert(oppApps.status === 200 && Array.isArray(oppApps.body.data) && oppApps.body.data.length > 0, "Alumni retrieves applications for posted opportunity");

  // Alumni updates applicant status
  const updateAppStatus = await req(`/api/opportunities/applications/${applicationId}/status`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${alumniToken}` },
    body: JSON.stringify({ status: "shortlisted" })
  });
  assert(updateAppStatus.status === 200 && updateAppStatus.body.application?.status === "shortlisted", "Alumni updates application status to 'shortlisted'");

  // 7. Community Feed & Interactive Posts
  console.log("\n--- 7. Community Feed & Posts ---");
  const postRes = await req("/api/posts", {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      content: "Just completed the AI Alumni Nexus interview preparation module! Highly recommended.",
      type: "achievement",
      tags: ["achievement", "interview"]
    })
  });
  assert(postRes.status === 201 && postRes.body._id, "Student creates community achievement post");
  const postId = postRes.body._id;

  const likeRes = await req(`/api/posts/${postId}/like`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${alumniToken}` }
  });
  assert(likeRes.status === 200 && likeRes.body.liked === true && likeRes.body.likes >= 1, "Alumni likes the post");

  const commentRes = await req(`/api/posts/${postId}/comment`, {
    method: "POST",
    headers: { Authorization: `Bearer ${alumniToken}` },
    body: JSON.stringify({ text: "Congratulations Arjun! Keep up the great work." })
  });
  assert(commentRes.status === 200 && commentRes.body.text?.includes("Congratulations"), "Alumni comments on student post");

  // 8. Notifications System & Deletion
  console.log("\n--- 8. In-App Notification Center ---");
  const notifs = await req("/api/notifications", {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(notifs.status === 200 && notifs.body.data.length > 0, "Student receives notifications for mentorship and application events");
  const notifId = notifs.body.data[0]._id;

  const markRead = await req(`/api/notifications/${notifId}/read`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(markRead.status === 200, "Student marks specific notification as read");

  const markAllRead = await req("/api/notifications/mark-all/read", {
    method: "PUT",
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(markAllRead.status === 200, "Student marks all notifications as read");

  const deleteNotif = await req(`/api/notifications/${notifId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(deleteNotif.status === 200, "Student successfully deletes notification via DELETE endpoint");

  const notifBatch = await req("/api/notifications/batch", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ ids: notifs.body.data.slice(1, 3).map((n) => n._id) })
  });
  assert(notifBatch.status === 200 && typeof notifBatch.body.deletedCount === "number", "Student successfully batch deletes notifications");

  // 9. Campus Events
  console.log("\n--- 9. Campus Events & Registration ---");
  const events = await req("/api/events", {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(events.status === 200 && events.body.data.length > 0, "Events retrieved successfully");
  const eventId = events.body.data[0]._id;

  const registerEvent = await req(`/api/events/${eventId}/register`, {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(registerEvent.status === 200 && typeof registerEvent.body.count === "number", "Student registers for campus workshop event");

  // 10. AI Career Suite Fallback & Operation
  console.log("\n--- 10. AI Career Suite ---");
  const skillAnalysis = await req("/api/ai/analyze-skills", {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ skills: ["JavaScript", "React", "Node.js"] })
  });
  assert(skillAnalysis.status === 200 && Array.isArray(skillAnalysis.body.missingSkills) && skillAnalysis.body.roadmap, "AI skill analysis returns career counseling roadmap (offline fallback operational)");

  const mockStart = await req("/api/ai/mock-interview/start", {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ role: "Full Stack Developer", level: "entry" })
  });
  assert(mockStart.status === 200 && Array.isArray(mockStart.body.questions) && mockStart.body.questions.length >= 3, "AI mock interview generates technical & behavioral interview questions");

  const mockAnswer = await req("/api/ai/mock-interview/answer", {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      question: "Explain difference between process and thread",
      answer: "A process has its own dedicated address space, while threads within the same process share memory."
    })
  });
  assert(mockAnswer.status === 200 && typeof mockAnswer.body.score === "number" && mockAnswer.body.feedback, "AI interview evaluates candidate answer and provides score + feedback");

  const resumeReview = await req("/api/ai/resume/review", {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      resumeText: "Arjun Kumar. Final year CSE. Skills: React, Node, MongoDB, C++. Projects: AI Alumni Nexus."
    })
  });
  assert(resumeReview.status === 200 && (resumeReview.body.score || resumeReview.body.feedback), "AI resume reviewer evaluates candidate profile");

  // Summary
  console.log("\n==================================================");
  console.log(`Test Execution Summary:`);
  console.log(`Total Checks: ${testsRun}`);
  console.log(`Passed:       ${testsPassed}`);
  console.log(`Failed:       ${testsFailed}`);
  console.log("==================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 ALL TESTS PASSED! Backend is 100% verified and operational.");
    process.exit(0);
  }
};

runSuite().catch((err) => {
  console.error("Test suite execution failed:", err);
  process.exit(1);
});
