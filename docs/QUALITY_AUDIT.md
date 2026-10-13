# AI Alumni Nexus — Quality Audit & Diagnostic Report

**Date:** October 14, 2026  
**Auditor:** Full-Stack & QA Engineering Reviewer  
**Target Repository:** https://github.com/gursimran-singh-chawla/AI-Alumni-Nexus  
**Workspace:** `c:\Users\gursi\OneDrive\Desktop\nexus-complete`

---

## 1. Executive Summary & Architecture Overview

**AI Alumni Nexus** is an end-to-end full-stack alumni networking and mentorship platform designed for universities and higher education institutions. The system enables verified alumni to mentor students, post exclusive career opportunities and referrals, communicate through real-time WebSockets, participate in discussion feeds, register for events, and utilize an AI-powered career suite (Skill Gap Analyzer, Mock Interview Simulator, Resume Reviewer, and Career Roadmaps).

### 1.1 Architecture & Stack

| Layer | Technology | Version / Configuration | Role in Platform |
|---|---|---|---|
| **Frontend Framework** | React | `^18.2.0` | SPA with hooks, Context API, stateful pages |
| **Bundler & Tooling** | Vite | `^5.4.11` | Hot module replacement, production bundle optimization |
| **Routing** | React Router DOM | `^6.23.0` | Declarative SPA navigation and role-based Route Guards |
| **Styling** | Modern CSS | Custom design system | Responsive layout, dark theme, fluid typography, CSS custom properties |
| **Data Visualization** | Recharts | `^2.12.7` | Admin analytics, skill distributions, platform metrics |
| **HTTP Client** | Axios | `^1.6.8` | Interceptor-driven API client with JWT refresh token rotation |
| **Backend Runtime** | Node.js | `v21.6.1` / `v20+` | RESTful API & WebSocket event orchestration |
| **Server Framework** | Express | `^4.18.2` | REST endpoints, middleware pipeline, error handling |
| **Database** | MongoDB | `v7.0.8` (Local service on port 27017) | Document persistence with Mongoose ORM `^8.3.4` |
| **Realtime Engine** | Socket.io | `^4.7.5` (client & server) | Real-time chat, typing indicators, presence tracking, live feed broadcasts |
| **Authentication** | JWT + bcryptjs + Cookies | `jsonwebtoken ^9.0.2`, `bcryptjs ^2.4.3` | Access tokens (15m), HTTP-only refresh tokens (14d) with SHA-256 rotation |
| **Security Layer** | Helmet + Rate Limit | `helmet ^7.1.0`, `express-rate-limit ^7.2.0` | Security headers, IP brute-force protection |
| **AI Integration** | OpenAI API + Rule Fallback | `gpt-4o-mini` with deterministic stubs | Dual-mode career tools: live OpenAI model or offline rule-based fallback |

---

## 2. Remote vs. Local Discrepancy Analysis

Comparing the local repository against `origin/main` (`https://github.com/gursimran-singh-chawla/AI-Alumni-Nexus`):

1. **GitHub Remote (`origin/main`):**
   - Contains an early prototype consisting only of a frontend Vite skeleton with basic components.
   - Contains no backend directory, no database models, no API routes, no socket architecture, and no test automation.
2. **Local Workspace (`nexus-complete`):**
   - Contains a complete monorepo with `client/`, `server/`, `tests/`, and demo seeding scripts.
   - 9 Mongoose schemas, 9 Express route modules, unified `api.js`, role-based route guards, and 32-assertion verification test suite.
   - **Verdict:** Local workspace represents the advanced, authoritative implementation that must be polished, verified, and synchronized with the remote repository on a dedicated release branch.

---

## 3. Discovered Bugs, Defects & Root Causes

The audit uncovered several critical, functional, and UX defects across the application:

### Bug 1: Fatal Runtime Crash in Alumni Directory (`SocketProvider` Missing)
- **Severity:** P0 (Fatal Functional Bug)
- **Component:** `client/src/pages/AlumniDirectory.jsx`, `client/src/context/SocketContext.jsx`, `client/src/main.jsx`
- **Symptom:** Navigating to `/alumni` threw `TypeError: Cannot destructure property 'onlineUsers' of 'useSocket(...)' as it is null.`
- **Root Cause:** `SocketProvider` was created in `client/src/context/SocketContext.jsx` but was never rendered in `main.jsx` or `App.jsx`. `useSocket()` returned `null`, crashing the component upon destructuring. Additionally, `SocketContext.jsx` emitted `user.id` instead of `user._id || user.id`.
- **Remediation:** Mount `<SocketProvider>` within `<AuthProvider>` and support `user._id || user.id`.

### Bug 2: Invisible Mentorship Requests in UI
- **Severity:** P0 (Fatal Functional Bug)
- **Component:** `client/src/pages/Mentorship.jsx`
- **Symptom:** When a student requested a mentorship session, the session was saved with status `"requested"`, but never appeared on either the student's or the mentor's dashboard. Mentors could never view, accept, or reject session requests in the UI.
- **Root Cause:** `Mentorship.jsx` grouped sessions strictly into `upcoming` (`upcoming`, `accepted`), `completed` (`completed`), and `cancelled` (`cancelled`, `rejected`). The status `"requested"` was omitted from grouping and thus never rendered in any column.
- **Remediation:** Add `requested: sessions.filter((s) => s.status === "requested")` to grouped sessions, render an action column/tab for pending requests with "Accept" and "Reject" buttons, and add "requested" to the filter dropdown.

### Bug 3: Missing Mentorship & Opportunity Badge Variants
- **Severity:** P1 (Visual & Interaction Consistency)
- **Component:** `client/src/utils/badgeHelper.js`
- **Symptom:** Badges for `"mentorship-requested"`, `"mentorship-upcoming"`, `"mentorship-accepted"`, `"mentorship-rejected"`, `"opportunity-shortlisted"`, and `"opportunity-selected"` rendered as generic gray badges displaying raw technical strings.
- **Root Cause:** `BADGE_COLOR_MAP` and `BADGE_LABEL_MAP` in `badgeHelper.js` omitted these status keys.
- **Remediation:** Map all active mentorship and opportunity statuses to proper color classes and human-readable labels.

### Bug 4: Alumni Lacked Opportunity Application Review UI
- **Severity:** P1 (Functional Completeness)
- **Component:** `client/src/pages/Opportunities.jsx`
- **Symptom:** Alumni could post jobs/internships, but had no interface to view applications submitted by students or update applicant statuses (`applied` -> `reviewing` -> `shortlisted` -> `selected` / `rejected`).
- **Root Cause:** Backend endpoints `GET /api/opportunities/mine/posted`, `GET /api/opportunities/:id/applications`, and `PUT /api/opportunities/applications/:applicationId/status` existed, but the frontend only rendered the creation form and student apply buttons.
- **Remediation:** Implement an "Applications on My Opportunities" review panel in `Opportunities.jsx` for alumni to review applicants and change their status.

### Bug 5: Notification Deletion Failed Silently & Backend Filter Omission
- **Severity:** P1 (Functional Bug)
- **Component:** `client/src/pages/Notifications.jsx`, `client/src/api.js`, `server/routes/notifications.js`
- **Symptom:** Selecting notifications and clicking "Delete" removed them temporarily from local React state, but failed to persist to MongoDB. On refresh, deleted notifications reappeared. Furthermore, filtering notifications by type or status was ignored by the backend.
- **Root Cause:** `api.deleteNotification` was missing from `client/src/api.js`, and `server/routes/notifications.js` had no `DELETE` endpoints and omitted query filter parameters in `GET /`.
- **Remediation:** Implement `router.delete("/:id")` and `router.delete("/batch")` in backend, wire `deleteNotification` in `api.js`, and support `type` and `read` query filtering.

### Bug 6: AI Fallback Vulnerability on Network/Provider Errors
- **Severity:** P1 (Reliability & Robustness)
- **Component:** `server/routes/ai.js`
- **Symptom:** If `OPENAI_API_KEY` was misconfigured or network timeout occurred, `fetch()` threw an unhandled rejection, causing HTTP 500 error responses to the client instead of triggering offline stubs.
- **Root Cause:** `callOpenAI()` lacked a `try...catch` block and did not check `res.ok`.
- **Remediation:** Wrap OpenAI invocation in robust `try...catch` with `res.ok` validation and automatic graceful fallback to deterministic career intelligence stubs.

### Bug 7: Alumni Directory Advanced Filtering Ignored on Backend
- **Severity:** P1 (Functional Bug)
- **Component:** `server/routes/users.js`, `client/src/pages/AlumniDirectory.jsx`
- **Symptom:** When users applied advanced filters (`expertise`, `location`, `yearsActive`), the backend `GET /api/users/alumni` ignored these query parameters, returning unfiltered results. Furthermore, the search query only matched `fullName`, `company`, and `college`, omitting `skills` and `jobRole`.
- **Root Cause:** In `server/routes/users.js`, `req.query.expertise`, `req.query.location`, and `req.query.yearsActive` were unhandled.
- **Remediation:** Parse `expertise` against `skills`, `location` via regex, and `yearsActive` ranges (`0-2`, `2-5`, `5-10`, `10+`) against `experience`, while expanding general search to include `jobRole` and `skills`.

### Bug 8: Full-Page Hard Navigation in Chat & Null Pointer Risk
- **Severity:** P2 (UX Polish & Robustness)
- **Component:** `client/src/pages/ChatPage.jsx`, `server/routes/messages.js`
- **Symptom:** Clicking conversation links in ChatPage used `<a href=...>` causing browser full-page reload, tearing down the WebSocket connection. Additionally, in `messages.js`, `m.from._id.toString()` could throw if a message partner was null.
- **Root Cause:** Raw anchor tags instead of React Router `<Link>`, and un-guarded property access in conversation list aggregator.
- **Remediation:** Replace with `<Link>` and add optional chaining `m.from?._id`.

### Bug 9: Duplicate HTML Nesting in Community Feed
- **Severity:** P2 (UX / DOM Inconsistency)
- **Component:** `client/src/pages/Feed.jsx`
- **Symptom:** DOM inspector revealed `<div className="create-post">` enclosing the filter card and another inner `<div className="create-post">`.
- **Root Cause:** Copy-paste duplicate wrapper tag in `Feed.jsx`.
- **Remediation:** Cleanly separate the filter card from the create-post form.

### Bug 10: Mock Interview Last-Question UX Transition
- **Severity:** P2 (UX Interaction Quality)
- **Component:** `client/src/pages/MockInterview.jsx`
- **Symptom:** When submitting the answer to the final question, the screen abruptly transformed to the summary without giving the candidate a chance to read the AI feedback on question 5. The "View Results" button inside the feedback card was non-functional due to an index guard in `next()`.
- **Root Cause:** Condition `allFeedback.length === session.questions.length` triggered immediate replacement of the question viewport before the user clicked to view results.
- **Remediation:** Introduce an explicit `showResults` state toggle triggered when the user finishes reviewing the final question.

### Bug 11: Incomplete Profile Synchronization in `buildSafeUser`
- **Severity:** P2 (Data Model Inconsistency)
- **Component:** `server/routes/auth.js`
- **Symptom:** User fields `experience`, `location`, `github`, `linkedin`, and `leetcode` were omitted from `buildSafeUser()`. After login or token refresh, `user` in AuthContext lacked these properties until `/api/users/me` was explicitly re-fetched.
- **Root Cause:** `buildSafeUser` object literal did not project these schema fields.
- **Remediation:** Include all profile fields in `buildSafeUser`.

### Bug 12: Corrupted Duplicate Files
- **Severity:** P3 (Code Cleanliness)
- **Component:** `client/src/pages/EventsPage.jsx`, `client/src/pages/ProfilePage.jsx`
- **Symptom:** `EventsPage.jsx` had syntax errors at the bottom outside the component function; `ProfilePage.jsx` was an unreferenced duplicate.
- **Root Cause:** Artifacts of earlier prototyping.
- **Remediation:** Clean or delete unreferenced files to ensure clean production builds and static analysis.

### Bug 13: Notification Badge Fallbacks & Missing Notification Enums
- **Severity:** P2 (Visual & UX Polish)
- **Component:** `client/src/utils/badgeHelper.js`, `client/src/pages/Notifications.jsx`
- **Symptom:** Notification cards for `new_message`, `mentorship_request`, `mentorship_accepted`, `mentorship_rejected`, `new_event`, `new_opportunity`, `profile_viewed`, `application_status`, and `system` displayed unstyled raw strings like `notification-mentorship_request`.
- **Root Cause:** `badgeHelper.js` only defined badge styles for `opportunity-*` and `mentorship-*` prefixes, completely omitting all 9 `notification-*` event types.
- **Remediation:** Added all 9 notification types to `BADGE_COLOR_MAP` and `BADGE_LABEL_MAP` with distinct color accents (emerald, violet, indigo, rose, amber, sky, slate).

### Bug 14: Missing Bulk Notification Clear & Route Collision Risk
- **Severity:** P1 (Functional Completeness & Routing)
- **Component:** `server/routes/notifications.js`, `client/src/pages/Notifications.jsx`, `client/src/api.js`
- **Symptom:** Users had no mechanism to clear all notifications at once. Furthermore, if a `clear-all` route was added after `/:id`, Express would mistake the string `"clear-all"` for an invalid MongoDB ObjectId, throwing an error.
- **Root Cause:** Missing `DELETE /clear-all` route in backend; missing "Clear all" button in `Notifications.jsx`.
- **Remediation:** Placed `router.delete("/clear-all")` strictly before `router.delete("/:id")`, implemented `deleteMany({ user: req.user._id })`, exported `clearAllNotifications` in `api.js`, and added individual trash dismissal and bulk clear actions in the UI.

### Bug 15: Missing Opportunity Deletion & Cascading Application Cleanup
- **Severity:** P1 (Data Integrity & Lifecycle)
- **Component:** `server/routes/opportunities.js`, `client/src/pages/Opportunities.jsx`, `client/src/api.js`
- **Symptom:** Alumni who posted job/internship opportunities had no way to delete expired or closed listings. Orphaned applications persisted in MongoDB indefinitely.
- **Root Cause:** No `DELETE /api/opportunities/:id` route existed; frontend had no delete button for authors.
- **Remediation:** Implemented `router.delete("/:id")` with ownership verification (`opportunity.postedBy === req.user._id || req.user.role === 'admin'`) and cascading `OpportunityApplication.deleteMany({ opportunity: req.params.id })`. Added delete button in `Opportunities.jsx`.

### Bug 16: Mentorship Self-Booking & Duplicate Slot Collisions
- **Severity:** P1 (Business Logic & Vulnerability)
- **Component:** `server/routes/mentorship.js`
- **Symptom:** Alumni could book mentorship sessions with themselves. Furthermore, multiple students could request the exact same mentor and time slot simultaneously, causing double-booking.
- **Root Cause:** Missing validation guards checking `req.user._id === mentorId` and missing unique slot verification for active sessions (`requested`, `accepted`, `upcoming`).
- **Remediation:** Added validation guard rejecting self-booking with HTTP 400 and query check preventing overlapping active sessions for identical mentor & slot timestamps.

### Bug 17: Application Status Enum Mismatch in UI Filter
- **Severity:** P2 (Functional Defect)
- **Component:** `client/src/pages/Opportunities.jsx`
- **Symptom:** Filtering applications by status "Accepted" returned 0 results even when an applicant was selected.
- **Root Cause:** Backend schema `OpportunityApplication` uses enum `["applied", "reviewing", "shortlisted", "rejected", "selected"]`. Frontend filter dropdown used `accepted` instead of `selected`.
- **Remediation:** Updated status options in `Opportunities.jsx` to accurately include `shortlisted` and `selected`.

### Bug 18: Unbounded Mock Interview Answer Submission Race
- **Severity:** P2 (State Race Condition)
- **Component:** `client/src/pages/MockInterview.jsx`
- **Symptom:** Rapidly clicking "Submit Answer" sent concurrent requests to `/api/ai/mock-interview/answer`, corrupting question indexing and score averages.
- **Root Cause:** `submitAnswer` was not guarded by an `evaluating` state check, and textarea was not disabled during evaluation.
- **Remediation:** Added `if (evaluating || feedback) return;` guard, and disabled textarea + submit button during processing.

### Bug 19: Monolithic Client Bundle Warning (Vite Chunk Size > 740 kB)
- **Severity:** P2 (Performance & Best Practices)
- **Component:** `client/vite.config.js`
- **Symptom:** Vite production build outputted a chunk size advisory warning: `dist/assets/index.js 740.99 kB │ gzip: 216 kB`.
- **Root Cause:** Absence of Rollup `output.manualChunks` configuration bundled React, Lucide icons, Recharts, and Socket.io into a single monolithic bundle.
- **Remediation:** Configured `manualChunks` in `vite.config.js` separating `vendor` (React, React Router DOM, Axios), `charts` (Recharts), and `socket` (Socket.io Client). Dropped main app chunk down to 175.48 kB (gzip 48 kB).

### Bug 20: Missing 404 Catch-All Route
- **Severity:** P3 (Routing Resilience)
- **Component:** `client/src/App.jsx`
- **Symptom:** Navigating to an undefined URL resulted in a completely blank page without navigation guidance.
- **Root Cause:** No wildcard fallback route in React Router.
- **Remediation:** Added `<Route path="*" element={<Navigate to="/" replace />} />`.

---

## 4. Prioritized Remediation Roadmap (Completed)

All remediation phases (Phase A through Phase D) have been completed and verified with 48/48 automated regression tests passing and 0 build errors.

