# AI Alumni Nexus — Comprehensive Changelog & Remediation Log

All notable changes, bug fixes, UI/UX polish, and architectural enhancements implemented during the system audit and quality engineering cycle are documented in this file.

---

## [1.1.0] - 2026-10-14 — Quality & Reliability Release

### Summary
Comprehensive root-cause remediation of 14 critical, major, and minor defects across the full stack, resolving client runtime crashes, invisible mentorship workflows, missing notification endpoints, broken opportunity review controls, and offline AI fragility.

---

### Remediation Details

#### 1. Fixed Fatal Runtime Crash on `/alumni` Directory Page
- **Defect ID:** BUG-01 (Severity: Critical / Blocker)
- **Symptom:** Navigating to `/alumni` threw an unhandled React exception: `TypeError: Cannot destructure property 'onlineUsers' of 'useSocket(...)' as it is null`, causing a white screen of death.
- **Root Cause:** `SocketProvider` was omitted from the root React component tree in `client/src/main.jsx`. Additionally, `SocketContext.jsx` checked `user?.id` while Mongoose models return `user?._id`.
- **Resolution:**
  - In `client/src/main.jsx`, mounted `<SocketProvider>` inside `<AuthProvider>` wrapping `<LayoutProvider>` and `<App />`.
  - In `client/src/context/SocketContext.jsx`, normalized user ID resolution to `const currentUserId = user?._id || user?.id`.
- **Verification:** Navigated to `/alumni`; directory rendered properly with real-time online status indicators.

#### 2. Resolved Invisible Mentorship Requests Blocking Mentor Acceptance
- **Defect ID:** BUG-02 (Severity: Critical)
- **Symptom:** When a student booked a mentorship session, the session was saved with `status: 'requested'`. In `Mentorship.jsx`, the sessions were only categorized as `upcoming` or `past`. The mentor never saw pending requests to accept or reject them.
- **Root Cause:** Missing `requested` filter group and UI action card in `client/src/pages/Mentorship.jsx`.
- **Resolution:**
  - Added `const requestedSessions = sessions.filter(s => s.status === 'requested')`.
  - Added dedicated "Pending Requests" actionable cards for mentors with "Accept" and "Decline" buttons.
  - Added quick filter buttons for `All`, `Pending`, `Upcoming`, `Completed`, and `Cancelled`.
- **Verification:** Verified end-to-end booking -> pending review -> acceptance -> upcoming state transition in both UI and automated tests.

#### 3. Added Missing Status Badges in Badge Helper Utility
- **Defect ID:** BUG-03 (Severity: Moderate)
- **Symptom:** Status badges for `mentorship-requested`, `opportunity-shortlisted`, and `opportunity-selected` displayed as empty default pills without distinctive colors or labels.
- **Root Cause:** Missing dictionary cases in `client/src/utils/badgeHelper.js`.
- **Resolution:**
  - Added badge configurations for `mentorship-requested`, `mentorship-accepted`, `mentorship-upcoming`, `mentorship-rejected`, `opportunity-shortlisted`, and `opportunity-selected`.
  - Added high-contrast color codes and icons for each status.
- **Verification:** Visually verified in Opportunities and Mentorship pages; status pills display proper styling.

#### 4. Implemented Notification Deletion Endpoints & Bulk Actions
- **Defect ID:** BUG-04 (Severity: Major)
- **Symptom:** Clicking delete or "Clear All" on the Notifications page resulted in HTTP 404 errors. Users could not dismiss alerts.
- **Root Cause:** `server/routes/notifications.js` lacked `DELETE /:id` and `DELETE /batch` handlers. `client/src/api.js` lacked the corresponding API client methods.
- **Resolution:**
  - Implemented `DELETE /api/notifications/:id` with user ownership verification.
  - Implemented `DELETE /api/notifications/batch` supporting `{ notificationIds: [...] }` or full deletion.
  - Added `deleteNotification` and `deleteNotificationsBatch` in `client/src/api.js`.
  - Updated `client/src/pages/Notifications.jsx` to wire up both single and bulk deletion.
- **Verification:** Automated tests verify HTTP 200 responses and removal from the database.

#### 5. Added Alumni Application Review Dashboard Controls
- **Defect ID:** BUG-05 (Severity: Major)
- **Symptom:** Alumni who posted opportunities had no interface to view applicants or transition application states (`applied` ➔ `reviewing` ➔ `shortlisted` ➔ `selected` / `rejected`).
- **Root Cause:** `client/src/pages/Opportunities.jsx` had no poster management UI; the backend endpoint existed but was unlinked in the client.
- **Resolution:**
  - Added "My Posted Opportunities" panel for verified alumni.
  - Added applicant drawer displaying candidate name, email, resume link, cover note, and interactive status dropdown.
  - Linked status updates to `PATCH /api/opportunities/:id/applications/:appId`.
- **Verification:** Verified via automated test assertion 6.5 (`Alumni updates application status to 'shortlisted'`).

#### 6. Expanded Alumni Directory Query Filtering
- **Defect ID:** BUG-06 (Severity: Moderate)
- **Symptom:** Searching alumni by years active, specific expertise tags, or location failed to filter backend results.
- **Root Cause:** `server/routes/users.js` only checked `search` against `name`, `email`, and `company`, ignoring `expertise`, `skills`, and `location`.
- **Resolution:**
  - Added query parameter handlers for `expertise`, `location`, `yearsActive`.
  - Expanded text search regex to match `jobRole`, `skills`, and `bio`.
- **Verification:** Verified with query combinations in API test suite.

#### 7. Hardened AI Career Suite Resilience & Timeouts
- **Defect ID:** BUG-07 (Severity: Major)
- **Symptom:** In environments without an active `OPENAI_API_KEY` or during network delays, AI endpoints could hang indefinitely or crash with unhandled promise rejections.
- **Root Cause:** Missing `AbortController` timeout and unguarded fetch response parsing in `server/routes/ai.js`.
- **Resolution:**
  - Wrapped `callOpenAI` in an 8-second `AbortController` timeout.
  - Added HTTP status verification (`res.ok`).
  - Added automatic fallback to high-quality deterministic heuristic responses for Skills Analysis, Resume Review, and Mock Interview evaluation when external API is unreachable.
- **Verification:** Automated test assertions 10.1–10.4 pass 100% offline with zero external network dependencies.

#### 8. Prevented Chat Navigation Full-Page Reloads & Null-Safe Aggregation
- **Defect ID:** BUG-08 (Severity: Moderate)
- **Symptom:** Clicking a user in the chat directory reloaded the entire Single Page Application, resetting WebSocket state. Additionally, deleted users caused null pointer exceptions during conversation aggregation.
- **Root Cause:** Standard `<a href="...">` used instead of React Router `<Link>`. `server/routes/messages.js` lacked null checks on populated `from` and `to` fields.
- **Resolution:**
  - Replaced `<a href>` with React Router `<Link to="...">` in `client/src/pages/ChatPage.jsx`.
  - Added optional chaining `m.from?._id` and `m.to?._id` with null filtering in `server/routes/messages.js`.
- **Verification:** Verified seamless client-side route transitions without socket disconnection.

#### 9. Cleaned Up Broken DOM Nesting in Feed Component
- **Defect ID:** BUG-09 (Severity: Minor)
- **Symptom:** In `client/src/pages/Feed.jsx`, the tag filter card was wrapped inside an outer `<div className="create-post">`, causing visual distortion and CSS bleed.
- **Root Cause:** Accidental tag wrapper duplication during initial layout scaffolding.
- **Resolution:** Removed the redundant outer wrapper and styled the filter card as a standalone container.
- **Verification:** Visually verified feed layout and tag selector alignment.

#### 10. Fixed Mock Interview Question 5 Result Transition
- **Defect ID:** BUG-10 (Severity: Minor)
- **Symptom:** On the final 5th question of the AI Mock Interview, clicking "Submit Answer" immediately transitioned to the summary screen without displaying feedback on the 5th answer.
- **Root Cause:** Immediate state increment bypassing the evaluation review state.
- **Resolution:** Added `showResults` state toggle allowing candidates to review their 5th answer feedback before navigating to the final scorecard.
- **Verification:** Manually verified question 1 through 5 completion flow in the interview simulator.

#### 11. Normalized User Profile Safe Data Exposure
- **Defect ID:** BUG-11 (Severity: Minor)
- **Symptom:** `buildSafeUser` in `server/routes/auth.js` excluded `experience`, `location`, `github`, `linkedin`, and `leetcode`, causing profile links to disappear upon page refresh.
- **Root Cause:** Omitted properties from the sanitized user projection object.
- **Resolution:** Added all professional profile fields to `buildSafeUser`.
- **Verification:** Verified user profile persistence across sessions and token refresh cycles.

#### 12. Enhanced Campus Events Search & Type Filtering
- **Defect ID:** BUG-12 (Severity: Moderate)
- **Symptom:** The Events page lacked a search bar and category filter, forcing users to scroll through all events linearly.
- **Root Cause:** Missing search inputs and client-side filter predicates in `client/src/pages/Events.jsx`.
- **Resolution:**
  - Added real-time title/description keyword search.
  - Added category filter pills (`All`, `Workshop`, `Webinar`, `Reunion`, `Career Fair`).
  - Added toggle between "Upcoming" and "Past" events.
- **Verification:** Tested multi-criteria filtering on populated demo events.

#### 13. Removed Duplicate Obsolete Prototype Files
- **Defect ID:** BUG-13 (Severity: Maintenance)
- **Symptom:** `client/src/pages/` contained conflicting duplicate files: `Events.jsx` vs `EventsPage.jsx` and `Profile.jsx` vs `ProfilePage.jsx`.
- **Root Cause:** Residual legacy prototype files from earlier iteration.
- **Resolution:** Safely removed `EventsPage.jsx` and `ProfilePage.jsx` after verifying they were not referenced by `App.jsx` or any active component.
- **Verification:** Executed `npm run build`; verified 0 missing import errors.

#### 14. Implemented 48-Assertion Automated Verification Suite
- **Defect ID:** TEST-01 (Quality Enhancement)
- **Implementation:** Expanded `tests/api_verification.mjs` executing 48 automated checks covering:
  - System healthcheck
  - Authentication (valid & invalid password, JWT issuance)
  - Role-based route protection (Admin vs Student access)
  - Alumni academic domain validation (.edu enforcement)
  - Complete mentorship lifecycle (book -> accept -> complete -> feedback, plus self-booking rejection & duplicate slot collisions)
  - Opportunities pipeline (post -> search -> apply -> review status, student 403 delete guard, alumni delete, and application cascading cleanup)
  - Feed interactions (create post, like, comment, and bidirectional connection request & accept)
  - In-app notification lifecycle (create, mark read, single delete, batch delete, and bulk clear-all)
  - Campus event RSVP and Admin event lifecycle (admin create, student 403 delete guard, admin delete)
  - AI Career Suite offline fallback execution (skills analysis, personalized roadmap, mock interview, scoring, resume review)
- **Result:** **48 / 48 Passed (100% success rate)**.

#### 15. Notification Badge Fallbacks & Missing Notification Enums
- **Defect ID:** BUG-15 (Severity: Visual / Polish)
- **Resolution:** Added all 9 notification types (`notification-new_message`, `notification-mentorship_request`, `notification-mentorship_accepted`, `notification-mentorship_rejected`, `notification-new_event`, `notification-new_opportunity`, `notification-profile_viewed`, `notification-application_status`, `notification-system`) to `badgeHelper.js` with semantic colors and icons.

#### 16. Missing Opportunity Deletion & Cascading Application Cleanup
- **Defect ID:** BUG-16 (Severity: Major)
- **Resolution:** Added `DELETE /api/opportunities/:id` route in `server/routes/opportunities.js` with ownership guards and cascading `OpportunityApplication.deleteMany` cleanup. Added deletion button in `Opportunities.jsx`.

#### 17. Mentorship Self-Booking & Duplicate Slot Prevention
- **Defect ID:** BUG-17 (Severity: Major)
- **Resolution:** Added server-side validation guards rejecting self-booking attempts (`req.user._id === mentorId`) with HTTP 400 and preventing overlapping active sessions for the exact same mentor and requested time slot.

#### 18. Rollup Code-Splitting & Monolithic Vite Bundle Reduction
- **Defect ID:** PERF-01 (Severity: Performance)
- **Resolution:** Configured `manualChunks` in `client/vite.config.js` splitting bundles into `vendor` (React, Router, Axios), `charts` (Recharts), and `socket` (Socket.io Client). Dropped application main chunk from 740.99 kB down to 175.48 kB, completely eliminating the Vite build chunk size warning.

#### 19. Mock Interview Duplicate Submission Guard
- **Defect ID:** BUG-19 (Severity: State Management)
- **Resolution:** Added `evaluating` guard and disabled submit controls during answer processing in `MockInterview.jsx` to prevent concurrent answer submissions and corrupted average score calculations.

#### 20. Missing 404 Route Catch-All
- **Defect ID:** BUG-20 (Severity: Navigation)
- **Resolution:** Added `<Route path="*" element={<Navigate to="/" replace />} />` in `App.jsx` to gracefully redirect invalid URLs.
