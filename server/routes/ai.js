import express from "express";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const callOpenAI = async (prompt, maxTokens = 600) => {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`OpenAI API returned status ${res.status}, using rule-based fallback.`);
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn("OpenAI call failed or timed out, using rule-based fallback:", err.message);
    return null;
  }
};

// POST /api/ai/analyze-skills
router.post("/analyze-skills", verifyToken, async (req, res) => {
  const { skills } = req.body;
  if (!skills?.length) return res.status(400).json({ message: "Skills required" });

  const aiText = await callOpenAI(
    `You are a career counselor. Given these skills: ${skills.join(", ")}.\nRespond in JSON with: { "missingSkills": [...], "roles": [...], "roadmap": [...3 steps...], "marketDemand": "high/medium/low", "salaryRange": "₹X - ₹Y LPA" }. JSON only.`
  );

  if (aiText) {
    try {
      const parsed = JSON.parse(aiText.replace(/```json|```/g, "").trim());
      return res.json(parsed);
    } catch (_) {}
  }

  // Stub fallback
  const missing = ["System Design", "DSA", "Cloud AWS"].filter((s) => !skills.map((x) => x.toLowerCase()).includes(s.toLowerCase()));
  res.json({
    missingSkills: missing.slice(0, 3),
    roles: ["Software Engineer", "Full Stack Developer", "SDE-I"],
    roadmap: ["Master Data Structures & Algorithms", "Build 3 projects with your current stack", "Apply to top product companies"],
    marketDemand: "high",
    salaryRange: "₹8 - ₹25 LPA"
  });
});

// POST /api/ai/mock-interview/start
router.post("/mock-interview/start", verifyToken, async (req, res) => {
  const { role = "Software Engineer", level = "entry" } = req.body;

  const aiText = await callOpenAI(
    `Generate 5 technical interview questions for a ${level}-level ${role} position in India. Respond in JSON: { "questions": [{ "id": 1, "q": "...", "hint": "...", "type": "technical/behavioral" }] }. JSON only.`
  );

  if (aiText) {
    try {
      const parsed = JSON.parse(aiText.replace(/```json|```/g, "").trim());
      return res.json({ interviewId: Date.now().toString(), ...parsed });
    } catch (_) {}
  }

  res.json({
    interviewId: Date.now().toString(),
    questions: [
      { id: 1, q: "Explain the difference between a process and a thread.", hint: "Think about memory sharing", type: "technical" },
      { id: 2, q: "What is time complexity of QuickSort in worst case?", hint: "Consider pivot selection", type: "technical" },
      { id: 3, q: "Tell me about a challenging project you built.", hint: "Use STAR method", type: "behavioral" },
      { id: 4, q: "How would you design a URL shortener like bit.ly?", hint: "Think about scale, DB, hashing", type: "system-design" },
      { id: 5, q: "Difference between SQL and NoSQL databases?", hint: "Consider use cases", type: "technical" }
    ]
  });
});

// POST /api/ai/mock-interview/answer - evaluate an answer
router.post("/mock-interview/answer", verifyToken, async (req, res) => {
  const { question, answer } = req.body;

  const aiText = await callOpenAI(
    `Interview question: "${question}"\nCandidate answer: "${answer}"\nEvaluate this answer for a tech job interview. Respond in JSON: { "score": 1-10, "feedback": "...", "betterAnswer": "..." }. JSON only.`
  );

  if (aiText) {
    try {
      const parsed = JSON.parse(aiText.replace(/```json|```/g, "").trim());
      return res.json(parsed);
    } catch (_) {}
  }

  res.json({
    score: 7,
    feedback: "Good answer! You covered the main points. Try to be more specific with examples.",
    betterAnswer: "A more complete answer would include real-world examples and edge cases."
  });
});

// POST /api/ai/resume/review
router.post("/resume/review", verifyToken, async (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText) return res.status(400).json({ message: "Resume text required" });

  const aiText = await callOpenAI(
    `Review this resume for a tech job in India:\n\n${resumeText.substring(0, 2000)}\n\nRespond in JSON: { "score": 1-100, "strengths": [...], "improvements": [...], "atsKeywords": [...], "summary": "..." }. JSON only.`,
    800
  );

  if (aiText) {
    try {
      const parsed = JSON.parse(aiText.replace(/```json|```/g, "").trim());
      return res.json(parsed);
    } catch (_) {}
  }

  res.json({
    score: 72,
    strengths: ["Clear project descriptions", "Good technical skills listed", "Education section is well formatted"],
    improvements: ["Add quantified achievements (e.g., improved speed by 40%)", "Include more keywords for ATS", "Add a professional summary at top"],
    atsKeywords: ["React", "Node.js", "REST API", "Agile", "Git", "Docker"],
    summary: "Solid resume with room for improvement in quantification and ATS optimization."
  });
});

// POST /api/ai/roadmap - personalized learning roadmap
router.post("/roadmap", verifyToken, async (req, res) => {
  const { goal, currentSkills, timeframe } = req.body;

  const aiText = await callOpenAI(
    `Create a learning roadmap for someone who wants to become a ${goal} in ${timeframe || "6 months"}. Current skills: ${currentSkills?.join(", ") || "beginner"}.\nRespond in JSON: { "phases": [{ "phase": 1, "title": "...", "duration": "...", "topics": [...], "resources": [...] }] }. JSON only.`
  );

  if (aiText) {
    try {
      const parsed = JSON.parse(aiText.replace(/```json|```/g, "").trim());
      return res.json(parsed);
    } catch (_) {}
  }

  res.json({
    phases: [
      { phase: 1, title: "Foundation", duration: "Month 1-2", topics: ["DSA Basics", "OOP Concepts", "Git & GitHub"], resources: ["LeetCode Easy", "CS50", "Git Docs"] },
      { phase: 2, title: "Core Skills", duration: "Month 3-4", topics: ["System Design Basics", "Database Design", "REST APIs"], resources: ["Grokking System Design", "MongoDB University"] },
      { phase: 3, title: "Portfolio Building", duration: "Month 5-6", topics: ["Build 2 Full Stack Projects", "Open Source Contribution", "Interview Prep"], resources: ["GitHub", "Pramp", "InterviewBit"] }
    ]
  });
});

export default router;
