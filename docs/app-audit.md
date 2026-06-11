# UniVerseX All-Actor App Audit

## Summary

This audit maps the current UniVerseX product across public visitors, demo users, students, professors, and admins. The app already covers account provisioning, demo mode, community, jobs, courses, materials, assignments, results, attendance, office hours, chat, discovery, planner, and budget. The biggest improvement themes are role clarity, dashboard usefulness, admin lead review, notification routing, consistent empty/loading states, and making powerful course tools easier to navigate.

## Actor Feature Matrix

| Actor | Main Entry Points | Allowed Actions | Blocked Actions | Current Issues | Recommended Fix |
| --- | --- | --- | --- | --- | --- |
| Visitor | Landing, Login, Request Access, Demo | Start demo, request access, login with provisioned account | Authenticated app actions | Public value is visible, but conversion path depends on admins seeing access requests | Keep Try Demo prominent and expose access requests in admin tools |
| Demo Student | Demo role chooser, Dashboard, Courses, Planner, Chat, Jobs | Explore student flows using demo data, create demo-only content, chat with demo students | Password changes, real uploads, production data access | Demo is useful but must remain visibly disposable | Keep demo banner, reset scripts, and role chooser; keep demo admin read-only |
| Demo Professor | Demo role chooser, Courses, Materials, Results, Office Hours | Preview professor workflows in demo scope | Real file uploads, production changes, account provisioning | Professor demo needs realistic seeded teaching data | Seed materials, courses, results, attendance, and bookings with professor-facing examples |
| Demo Admin | Demo role chooser, Account Management | View demo accounts | Create real accounts, view production access leads | Safe but limited | Keep account form disabled and hide production access requests |
| Student | Dashboard, Planner, Courses, Materials, Chat, Jobs, Budget | Join courses, view materials/results, submit assignments, book office hours, chat with student connections, browse jobs | Publish jobs, manage course content, connect with professors/admins | Academic work is spread across multiple pages | Make dashboard and planner the student daily hub |
| Professor | Dashboard, Courses, Course Detail, Jobs, Office Hours | Create/manage courses, materials, assignments, results, attendance, Q&A, office hours, jobs | Student-only chat/discovery/budget, admin account creation | Professor tools exist but are buried in course detail page | Add professor-oriented dashboard and clearer course workspace navigation |
| Admin | Dashboard, Account Management, Community, Jobs, Courses | Create student/professor accounts, view managed users, publish/manage jobs, view app areas | Demo admin cannot affect production; public signup remains disabled | Access requests existed but were not reviewable by admins | Add access-request review to account management |

## Route And Feature Inventory

| Area | Frontend Route | Backend Surface | Primary Actors | Notes |
| --- | --- | --- | --- | --- |
| Auth/session | `/login`, `/onboarding`, `/profileEdit` | `/api/users/*` | Student, Professor, Admin | Public signup is disabled unless configured; onboarding handles first login |
| Demo | `/demo` | `/api/demo/*` | Visitor, Demo roles | Same database with `dataScope` demo isolation |
| Dashboard | `/dashboard` | mixed frontend aggregates | All authenticated actors | Now role-aware; future work should add richer actor metrics |
| Account management | `/admin/accounts` | `/api/users/admin/accounts` | Admin | Creates student/professor accounts only; demo admin is read-only |
| Access requests | `/admin/accounts` | `/api/users/admin/access-requests` | Admin | New review workflow for public/demo access leads |
| Courses/workspace | `/courses`, `/courses/:id` | `/api/courses`, `/api/assignments`, `/api/results`, `/api/course-qa`, `/api/course-attendance` | Student, Professor, Admin | Powerful but dense; needs tabs or section navigation |
| Materials | `/courses/:id`, dashboard/planner surfaces | `/api/courses/:courseId/materials` | Student, Professor, Admin | Supports lifecycle, scheduling, read/bookmark states, and student visibility controls |
| Jobs | `/jobs` | `/api/jobposting` | Student, Professor, Admin | Backend and frontend prevent students from publishing |
| Chat | `/chat` | `/api/chats` | Student | Groups and DMs are separated; non-students are blocked |
| Discovery/connections | `/students`, `/connections` | `/api/discovery/*` | Student | Backend limits connections to student-to-student |
| Planner/budget | `/class`, `/budget` | `/api/academic`, `/api/transaction` | Student | Planner is the best candidate for student daily hub |
| Notifications | Bell component | `/api/notifications` | All authenticated actors | Routes to broad destinations; needs deeper item-level destinations later |

## Prioritized Findings

### P0: Security And Data Safety
- Demo mode is separated by `dataScope`; keep every new model and query covered by the scoped plugin.
- Demo admins must not create production accounts or inspect production access leads.
- Student job publishing is blocked in backend and hidden in UI; keep both layers.
- Student discovery/connection logic correctly blocks non-student recipients; keep professor/admin connection controls disabled.

### P1: Core Workflow Friction
- Professor workflows are available but too course-detail centric. Add a professor dashboard with courses, pending Q&A, assignments, office-hour bookings, and material activity.
- Student academic work is split across dashboard, planner, courses, results, and office hours. Keep improving dashboard/planner as the daily hub.
- Access requests were collected but not reviewable by admins. This audit pass adds the missing admin review loop.
- Course detail is powerful but long. Add section tabs or sticky in-page navigation.

### P2: Product And UX Improvements
- Notifications should route to exact objects where possible: specific course section, assignment, material, result, office-hour booking, chat, post, or job.
- Admin account management needs deactivate/reactivate, reset temporary password, and welcome instruction resend.
- Jobs should support student save/interest state and deadline reminders.
- Chat should add unread counts and last-read state.
- Courses should surface "needs action" summaries for assignments, unread materials, Q&A, and upcoming office hours.

### P3: Polish And Accessibility
- Replace confusing copy and mojibake characters where found.
- Standardize empty, loading, and error states across every major module.
- Add aria labels to icon-only buttons, especially nav, notifications, cards, and modal close controls.
- Improve mobile density for course workspace, admin tables, and chat.

## Acceptance Checklist For Future Audits

- Every actor has a clear dashboard and top navigation.
- Every frontend role gate has a matching backend authorization rule.
- Every notification type routes somewhere useful.
- Every demo action is either demo-scoped or explicitly blocked.
- Every admin lead/account workflow has a visible next step.
- Every major page has loading, empty, error, and mobile states.
