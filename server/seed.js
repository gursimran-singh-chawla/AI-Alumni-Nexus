import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import Event from "./models/Event.js";

dotenv.config();
await connectDB();

// Clean up
await User.deleteMany({ email: { $in: ["admin@nexus.com","alumni@nexus.com","student@nexus.com"] } });

const hash = async (p) => bcrypt.hash(p, 12);

const adminUser = await User.create({
  fullName: "Admin User", email: "admin@nexus.com", password: await hash("admin123"),
  role: "admin", college: "IIT Delhi", branch: "CSE", skills: ["Management","Analytics"],
  profileComplete: 95
});

const alumniUser = await User.create({
  fullName: "Priya Sharma", email: "alumni@nexus.com", password: await hash("alumni123"),
  role: "alumni", college: "IIT Bombay", branch: "CSE", year: "2020",
  company: "Google", jobRole: "Senior Software Engineer", experience: 4,
  location: "Bengaluru", bio: "Full-stack developer at Google. Passionate about mentoring students.",
  skills: ["React", "Node.js", "Python", "System Design", "DSA"],
  mentorshipAvailability: true, mentorAvailabilityStatus: "available", github: "https://github.com", linkedin: "https://linkedin.com",
  registrationNumber: "IITB-2020-CSE-1024", passingYear: "2020", emailVerified: true, verificationStatus: "verified",
  profileComplete: 95
});

const studentUser = await User.create({
  fullName: "Arjun Kumar", email: "student@nexus.com", password: await hash("student123"),
  role: "student", college: "NIT Warangal", branch: "CSE", year: "2026",
  bio: "Final year CSE student. Looking for mentorship in SDE roles.",
  skills: ["C++", "React", "Node.js", "MongoDB"],
  mentor: alumniUser._id, profileComplete: 65
});

alumniUser.mentees.push(studentUser._id);
await alumniUser.save();

// Create some posts
await Post.create([
  { author: alumniUser._id, content: "Excited to share that I just got promoted to Senior SWE at Google! 🎉 Hard work and consistency pays off. For all students - focus on DSA and system design!", type: "achievement", tags: ["google","placement","achievement"] },
  { author: adminUser._id, content: "Welcome to AI Alumni Nexus! 🚀 Connect with alumni, use our AI tools, and accelerate your career. Post your questions, achievements, and updates here!", type: "general" },
  { author: alumniUser._id, content: "Tips for cracking Product-based company interviews:\n1. Master DSA (LeetCode Medium daily)\n2. Learn System Design basics\n3. Practice behavioral STAR method\n4. Build real projects\n\nAMA in the comments!", type: "general", tags: ["interview","tips","placement"] },
]);

// Create some events
await Event.create([
  { title: "Resume Building Workshop", description: "Learn how to build an ATS-friendly resume that gets shortlisted at top companies.", date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), location: "Online (Zoom)", type: "workshop", organizer: adminUser._id },
  { title: "Google Engineer Webinar", description: "Priya Sharma shares her journey from NIT to Google and tips for cracking product company interviews.", date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), location: "Online", type: "webinar", organizer: alumniUser._id },
  { title: "Alumni Meetup - Bengaluru", description: "Annual meetup for alumni in Bengaluru. Network, share opportunities, and reconnect.", date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), location: "Bengaluru", type: "meetup", organizer: adminUser._id },
]);

console.log("✅ Demo accounts created:");
console.log("   Admin:   admin@nexus.com / admin123");
console.log("   Alumni:  alumni@nexus.com / alumni123");
console.log("   Student: student@nexus.com / student123");
await mongoose.disconnect();
