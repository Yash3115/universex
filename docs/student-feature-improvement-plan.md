# UniVerseX Student Feature Audit and Improvement Plan

## Current Student Feature Map

### Entry and Account
- Students enter through login. Public self-signup is no longer the normal path; the signup route now explains that accounts are admin-managed, and backend signup/OTP are disabled unless explicitly enabled with `ALLOW_PUBLIC_SIGNUP=true`.
- Profiles support image, bio, contact number, Instagram, LinkedIn, department, and graduation year.
- First-time admin-provisioned users are guided through password change, profile completion, and department setup because those fields unlock discovery, chat, courses, and department groups.

### Dashboard and Navigation
- The dashboard links to community, budget, jobs, contact directory, academic planner, profile, and student discovery.
- The top nav links to community, jobs, planner, courses, chat, students, budget, and profile.
- Main friction: related academic features are split across planner, courses, results, office hours, and course detail pages without a unified student journey.

### Community and Notifications
- Students can create posts, comment, like, save, report, and receive notifications.
- Admin/professor posts can appear in community.
- Main friction: community actions and notifications are useful, but post authorship, moderation states, saved posts, and notification destinations need clearer visual hierarchy.

### Student Discovery, Connections, Interactions, and Chat
- Students can discover other students, request connections, manage accepted connections, label/favorite/note connections, send structured interactions, and chat with accepted connections.
- Department group chat is available based on the student's profile department.
- Main friction: users need clearer next steps after connection acceptance, plus better unread indicators, search, and empty states in chat.

### Jobs and Opportunities
- Students can browse and apply to opportunities.
- Professors/admins can publish opportunities.
- Main friction: students need saved jobs, deadline reminders, eligibility tags, and filtering that highlights what they are actually eligible for.

### Academic Planner
- Students can save a weekly schedule, mark personal attendance, and manage manual tasks.
- Planner now surfaces tasks, schedule, courses, materials, assignments, and published results.
- Main friction: tasks are still manually managed; assignments and assessment dates should create suggested tasks automatically.

### Courses, Materials, Assignments, Results, Attendance, and Office Hours
- Students can discover/join courses, access professor materials, view announcements, ask questions, submit assignments, view published results, see official attendance, and book office hours.
- Professors can manage course materials, assignments, assessments, gradebooks, attendance sessions, Q&A, announcements, and office-hour slots.
- Main friction: course detail pages are powerful but dense; students need a cleaner "today / upcoming / needs action" view.

### Budget and Contact Directory
- Students can track expenses, analytics, budgets, and access campus contacts.
- Main friction: budget insights are separate from academic and job deadlines; contact directory is static and should be searchable/favoritable.

## Accessibility and UI Issues to Address

- Replace decorative gradient-heavy screens with calmer, consistent layouts for repeated-use tools.
- Use clear focus states, semantic headings, and form labels on all forms.
- Ensure all icon-only controls have accessible names and visible text alternatives where needed.
- Improve keyboard navigation for modals, dropdowns, chat composer, task controls, and course filters.
- Reduce nested cards and use full-width workspace sections for planner/course pages.
- Add consistent empty, loading, error, and success states across all student pages.
- Make mobile flows first-class: bottom-safe spacing, compact action bars, and fewer hidden desktop-only controls.

## Functional Improvement Roadmap

### Phase 1: Account Control and First-Login Readiness
- Disable public self-signup as the normal path. Implemented: landing/login copy points to admin-managed access and backend signup is gated by `ALLOW_PUBLIC_SIGNUP`.
- Let admins provision Student and Professor accounts only. Implemented: admins can create and list managed accounts from the admin accounts page.
- Generate a temporary password and force new users to change it at first login. Implemented: the API returns the temporary password once and stores onboarding flags.
- Force first-login profile setup with department and contact details, because those fields power discovery, courses, and department groups. Implemented: guarded routes redirect flagged users to first-login setup.

### Phase 2: Student Home Workspace
- Turn the dashboard into a daily command center with: next class, pending tasks, new materials, recent results, unread chats, and upcoming deadlines.
- Add "continue where you left off" links for active course, chat, and assignment work.
- Add consistent quick actions: update profile, open planner, open courses, open chat, view results.

### Phase 3: Academic Automation
- Auto-create suggested tasks from assignments, assessments, office-hour bookings, and course announcements.
- Add task source badges and one-click navigation back to the source course item.
- Add calendar-style schedule and deadline views.
- Add reminders for low attendance, upcoming deadlines, and new published results.

### Phase 4: Course Experience
- Add a student-focused course overview tab before the full course detail feed.
- Group course content into "Needs action", "Latest materials", "Upcoming assessments", "Professor updates", and "Ask a doubt".
- Add material bookmarks and "mark as read" states.
- Add result trends and assessment feedback summaries.

### Phase 5: Social and Collaboration
- Add unread counts and last-read state to direct and department chats.
- Add search within chats and connections.
- Add study groups inside courses and departments.
- Allow students to create project rooms from accepted connections while keeping admin/professor messaging controlled.

### Phase 6: Admin and Governance
- Add an admin account management table with filters by role, department, onboarding status, and active status.
- Add reset temporary password, deactivate account, and resend welcome instructions.
- Add audit logging for admin account creation and role-sensitive actions.

## Success Metrics

- New student reaches completed profile and changed password in under 3 minutes.
- Student can find courses, materials, results, chat, and planner from the top nav in one click.
- Student can identify today's academic work within 10 seconds of opening the dashboard/planner.
- Course materials and results have clear empty/loading/error states and mobile-friendly layouts.
- Keyboard-only users can complete login, onboarding, task creation, chat send, and course navigation.
