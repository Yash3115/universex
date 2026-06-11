# UniVerseX Improvement Roadmap

## Summary

This roadmap turns the all-actor audit into an implementation backlog. The first pass focuses on permission safety, role-aware navigation, useful dashboards, and admin access-request review. Later phases deepen academic automation, professor workflows, admin governance, and collaboration.

## Phase 1: Safety, Role Clarity, And Admin Leads

Status: first pass implemented in this branch.

- Make dashboard cards role-aware:
  - Students see planner, courses, materials, jobs, budget, discovery, and profile.
  - Professors see courses, results, jobs, office hours, community, contacts, and profile.
  - Admins see account management, access requests, jobs, courses, community, contacts, and profile.
- Make navbar role-aware:
  - Hide student-only chat, discovery, planner, and budget from professors/admins.
  - Keep shared academic and governance links visible to relevant actors.
- Add admin access-request review:
  - List new requests from public/demo request access flow.
  - Mark requests reviewed or closed.
  - Prefill account creation form from an access request.
  - Block this workflow for demo admins.
- Preserve safety rules:
  - Students cannot publish jobs or manage course content.
  - Professors cannot create accounts or manage unrelated courses.
  - Demo admins cannot create production accounts or inspect production leads.

## Phase 2: Student Daily Hub

- Dashboard:
  - Add upcoming assignments, latest results, unread chat count, office-hour bookings, and due tasks.
  - Add "continue" links for active course, latest material, and recent chat.
- Planner:
  - Auto-suggest tasks from assignments, assessments, office-hour bookings, and urgent announcements.
  - Add source badges and one-click navigation to the originating course item.
  - Add calendar-style deadline and class views.
- Courses:
  - Add a student-focused overview before the full course workspace.
  - Group content by needs action, latest materials, assignments, results, attendance, Q&A, and office hours.
- Jobs:
  - Add saved jobs, eligibility tags, deadline reminders, and application-interest tracking.

## Phase 3: Professor Teaching Workspace

- Professor dashboard:
  - Show active courses, pending student questions, recent material engagement, assignment submissions, unpublished results, attendance sessions, and office-hour bookings.
- Course workspace:
  - Add sticky tabs or section navigation for materials, announcements, Q&A, assignments, results, attendance, office hours, and roster.
  - Add course-level "needs attention" summaries.
- Materials:
  - Keep draft/publish/schedule/archive/pin/read analytics.
  - Add bulk upload and module folders after the single-material workflow is stable.
- Results and attendance:
  - Add CSV import for grades.
  - Add attendance templates and low-attendance warnings.
- Office hours:
  - Add recurring slots, reschedule flow, and clearer booking status history.

## Phase 4: Admin Governance

- Account management:
  - Add deactivate/reactivate account.
  - Add reset temporary password.
  - Add resend welcome instructions.
  - Add filters for department, college, active status, and provisioned date.
- Access requests:
  - Add status tabs for new, reviewed, and closed.
  - Add conversion notes and "created account from request" status.
  - Add duplicate detection by email.
- Moderation:
  - Add reported posts/comments queue.
  - Add admin audit log for sensitive actions.
- Demo operations:
  - Add visible demo reset timestamp.
  - Keep reset manual unless the deployment owner enables automation.

## Phase 5: Notifications And Collaboration

- Notification routing:
  - Route to exact resources where possible: material, assignment, result, Q&A item, attendance session, office-hour booking, job, post, chat.
  - Add unread grouping by feature.
- Chat:
  - Add unread counts, last-read markers, and message search.
  - Add course study groups after permissions are clear.
- Connections:
  - Add suggested peers based on department, courses, and mutual connections.
  - Keep student-to-student connection rules unless product policy changes.

## Implementation Backlog

| Priority | Actor | Task | Acceptance Criteria |
| --- | --- | --- | --- |
| P0 | Shared | Verify every frontend role gate has backend authorization | Attempts from blocked roles return 403 or safe empty UI |
| P0 | Demo/Admin | Keep demo admin away from production account creation and access leads | Demo admin sees read-only account page and cannot call non-demo endpoints |
| P1 | Admin | Review access requests | Admin can see new requests, prefill account form, mark reviewed/closed |
| P1 | Student | Daily academic dashboard | Student sees recent materials, upcoming assignments, results, and tasks |
| P1 | Professor | Teaching dashboard | Professor sees courses, pending Q&A, submissions, bookings, and material activity |
| P1 | Course Workspace | Section navigation | Users can jump between materials, assignments, results, attendance, Q&A, office hours |
| P2 | Notifications | Deep links | Each notification opens the most relevant page/section |
| P2 | Jobs | Save/interest flow | Student can save opportunities and track interest without publishing jobs |
| P2 | Admin | Reset/deactivate accounts | Admin can reset temp password and deactivate/reactivate users |
| P3 | Accessibility | Keyboard/modal/nav pass | Core workflows are usable by keyboard and screen readers |

## Test Strategy

- Run backend syntax checks for changed controllers/routes.
- Run frontend production build.
- Smoke test by actor:
  - Visitor: landing, demo, request access.
  - Student: dashboard, planner, courses/materials, jobs, chat, discovery, budget.
  - Professor: dashboard, courses, materials, assignments, results, attendance, office hours, jobs.
  - Admin: accounts, access requests, jobs, community, demo safety.
- Permission tests:
  - Student cannot publish jobs, create accounts, manage materials, or connect with non-students.
  - Professor cannot access admin accounts or student chat.
  - Demo admin cannot create production accounts or list access requests.
  - Demo users only see demo-scoped data.

## Assumptions

- Demo mode remains same app and same database with `dataScope` isolation.
- Public signup remains disabled by default.
- Admins remain the only actor who can create real student/professor accounts.
- The app should evolve incrementally around the current React/Redux and Express/Mongoose structure.
