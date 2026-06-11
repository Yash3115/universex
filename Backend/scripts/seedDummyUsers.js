const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
require("../utils/registerDataScopePlugin");

const { DATA_SCOPES, getDataScope, runWithDataScope, runWithoutDataScope } = require("../utils/dataScope");
const Assessment = require("../models/assessmentSchema");
const Assignment = require("../models/assignmentSchema");
const ChatMessage = require("../models/chatMessageSchema");
const ChatThread = require("../models/chatThreadSchema");
const Connection = require("../models/connectionSchema");
const Course = require("../models/courseSchema");
const CourseAnnouncement = require("../models/courseAnnouncementSchema");
const CourseMaterial = require("../models/courseMaterialSchema");
const FacultyProfile = require("../models/facultyProfileSchema");
const GradeRecord = require("../models/gradeRecordSchema");
const Job = require("../models/jobSchema");
const Profile = require("../models/profileSchema");
const User = require("../models/userSchema");

const DEFAULT_PASSWORD = "Password@123";
const DEFAULT_IMAGE = {
  url: "https://api.dicebear.com/8.x/initials/svg?seed=UniverseX",
  publicId: "dummy-user-avatar",
  format: "svg",
};

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const buildPairKey = (firstUserId, secondUserId) => [String(firstUserId), String(secondUserId)].sort().join(":");

const scopedPayload = (payload = {}) => ({
  ...payload,
  dataScope: getDataScope(),
});

const findFixtureUser = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  return runWithoutDataScope(async () => {
    const scopedUser = await User.findOne({ email: normalizedEmail, dataScope: getDataScope() });
    if (scopedUser) return scopedUser;

    if (getDataScope() === DATA_SCOPES.DEMO && normalizedEmail.endsWith("@universex.demo")) {
      return await User.findOne({ email: normalizedEmail });
    }

    return null;
  });
};

const findFixtureRecord = async (Model, filter) =>
  runWithoutDataScope(async () => {
    const scopedRecord = await Model.findOne({ ...filter, dataScope: getDataScope() });
    if (scopedRecord) return scopedRecord;
    if (getDataScope() === DATA_SCOPES.DEMO) return await Model.findOne(filter);
    return null;
  });

const upsertFixtureRecord = async (Model, filter, update) => {
  const updatePayload = scopedPayload(update);
  const existing = await findFixtureRecord(Model, filter);

  if (existing) {
    const updated = await runWithoutDataScope(async () =>
      await Model.findByIdAndUpdate(existing._id, updatePayload, {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      })
    );
    if (updated) return updated;
  }

  return Model.create(updatePayload);
};

const dummyUsers = [
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@universex.demo",
    role: "Admin",
    college: "UniverseX Admin College",
    gender: "Other",
    dateOfBirth: "1998-01-01",
    balance: 100000,
    profile: {
      about: "Demo admin account for managing UniverseX.",
      contactNumber: 9000000001,
      department: "Administration",
      graduationYear: 2020,
      skills: ["Administration", "Moderation", "Operations"],
      interests: ["Campus management", "Community safety"],
      visibility: "public",
    },
  },
  {
    firstName: "Dr. Ananya",
    lastName: "Rao",
    email: "professor@universex.demo",
    role: "Professor",
    college: "UniverseX Institute of Technology",
    gender: "Female",
    dateOfBirth: "1987-11-12",
    balance: 50000,
    profile: {
      about: "Professor of Computer Science mentoring projects, research, and placement preparation.",
      contactNumber: 9000000010,
      department: "Demo Computer Science Engineering",
      graduationYear: 2010,
      skills: ["Machine Learning", "Data Structures", "Research Mentoring"],
      interests: ["Applied AI", "Student research", "Career guidance"],
      visibility: "public",
    },
    facultyProfile: {
      employeeId: "UX-FAC-101",
      designation: "Associate Professor",
      department: "Demo Computer Science Engineering",
      officeLocation: "Block B, Room 304",
      bio: "Mentors capstone teams and coordinates industry-backed AI projects.",
      researchAreas: ["Responsible AI", "Learning analytics", "Human-centered computing"],
      website: "https://universex.demo/faculty/ananya-rao",
    },
  },
  {
    firstName: "Dr. Kabir",
    lastName: "Menon",
    email: "prof.kabir@universex.demo",
    role: "Professor",
    college: "UniverseX Institute of Technology",
    gender: "Male",
    dateOfBirth: "1982-04-08",
    balance: 50000,
    profile: {
      about: "Professor of AI and data systems leading hands-on labs and research sprints.",
      contactNumber: 9000000011,
      department: "Demo Computer Science Engineering",
      graduationYear: 2006,
      skills: ["Deep Learning", "Data Engineering", "Academic Mentoring"],
      interests: ["Applied ML", "MLOps", "Student startups"],
      visibility: "public",
    },
    facultyProfile: {
      employeeId: "UX-FAC-102",
      designation: "Professor",
      department: "Demo Computer Science Engineering",
      officeLocation: "Block C, Room 212",
      bio: "Runs the Applied ML studio and helps students publish practical AI projects.",
      researchAreas: ["Deep learning", "MLOps", "Information retrieval"],
      website: "https://universex.demo/faculty/kabir-menon",
    },
  },
  {
    firstName: "Dr. Nisha",
    lastName: "Sen",
    email: "prof.nisha@universex.demo",
    role: "Professor",
    college: "UniverseX Institute of Technology",
    gender: "Female",
    dateOfBirth: "1985-09-19",
    balance: 50000,
    profile: {
      about: "Electronics professor coordinating embedded systems labs and robotics projects.",
      contactNumber: 9000000012,
      department: "Demo Electronics and Communication Engineering",
      graduationYear: 2008,
      skills: ["Embedded Systems", "IoT", "Robotics"],
      interests: ["Hardware labs", "Robotics club", "Industry projects"],
      visibility: "public",
    },
    facultyProfile: {
      employeeId: "UX-FAC-103",
      designation: "Assistant Professor",
      department: "Demo Electronics and Communication Engineering",
      officeLocation: "Electronics Lab, Room 118",
      bio: "Guides hardware prototypes and lab-based course projects.",
      researchAreas: ["Embedded AI", "Sensor networks", "Robotics education"],
      website: "https://universex.demo/faculty/nisha-sen",
    },
  },
  {
    firstName: "Student",
    lastName: "User",
    email: "student@universex.demo",
    role: "Student",
    college: "UniverseX Institute of Technology",
    gender: "Other",
    dateOfBirth: "2003-05-15",
    balance: 25000,
    profile: {
      about: "General demo student account for testing the student flow.",
      contactNumber: 9000000002,
      department: "Demo Computer Science Engineering",
      graduationYear: 2026,
      skills: ["JavaScript", "React", "Node.js"],
      interests: ["Hackathons", "Open source", "AI"],
      visibility: "public",
    },
  },
  {
    firstName: "Alex",
    lastName: "Sharma",
    email: "alex@universex.demo",
    role: "Student",
    college: "UniverseX Institute of Technology",
    gender: "Male",
    dateOfBirth: "2002-09-10",
    balance: 15000,
    profile: {
      about: "Demo engineering student interested in jobs and community posts.",
      contactNumber: 9000000003,
      department: "Information Technology",
      graduationYear: 2025,
      skills: ["MongoDB", "Express", "React", "Node"],
      interests: ["Startups", "Web development", "Football"],
      visibility: "public",
    },
  },
  {
    firstName: "Priya",
    lastName: "Mehta",
    email: "priya@universex.demo",
    role: "Student",
    college: "UniverseX School of Design",
    gender: "Female",
    dateOfBirth: "2004-03-21",
    balance: 18000,
    profile: {
      about: "Demo design student for testing profiles, discovery, and posts.",
      contactNumber: 9000000004,
      department: "Product Design",
      graduationYear: 2027,
      skills: ["UI/UX", "Figma", "Research"],
      interests: ["Design systems", "Photography", "Campus events"],
      visibility: "public",
    },
  },
  {
    firstName: "Rohan",
    lastName: "Kapoor",
    email: "rohan@universex.demo",
    role: "Student",
    college: "UniverseX Institute of Technology",
    gender: "Male",
    dateOfBirth: "2003-08-04",
    balance: 12000,
    profile: {
      about: "Backend-focused student building APIs and campus automation tools.",
      contactNumber: 9000000005,
      department: "Demo Computer Science Engineering",
      graduationYear: 2026,
      skills: ["Java", "Spring Boot", "PostgreSQL"],
      interests: ["Cloud", "Competitive programming", "Mentoring juniors"],
      visibility: "public",
    },
  },
  {
    firstName: "Meera",
    lastName: "Nair",
    email: "meera@universex.demo",
    role: "Student",
    college: "UniverseX Institute of Technology",
    gender: "Female",
    dateOfBirth: "2004-12-18",
    balance: 14000,
    profile: {
      about: "Data science student exploring dashboards, analytics, and research internships.",
      contactNumber: 9000000006,
      department: "Data Science",
      graduationYear: 2027,
      skills: ["Python", "Pandas", "Tableau"],
      interests: ["Research", "Analytics", "Scholarships"],
      visibility: "college",
    },
  },
  {
    firstName: "Ishan",
    lastName: "Verma",
    email: "ishan@universex.demo",
    role: "Student",
    college: "UniverseX Business School",
    gender: "Male",
    dateOfBirth: "2002-06-25",
    balance: 22000,
    profile: {
      about: "MBA student interested in product strategy, finance clubs, and internships.",
      contactNumber: 9000000007,
      department: "Business Analytics",
      graduationYear: 2025,
      skills: ["Excel", "Market Research", "SQL"],
      interests: ["Case competitions", "Fintech", "Product management"],
      visibility: "public",
    },
  },
  {
    firstName: "Sara",
    lastName: "Khan",
    email: "sara@universex.demo",
    role: "Student",
    college: "UniverseX Institute of Technology",
    gender: "Female",
    dateOfBirth: "2003-02-09",
    balance: 16000,
    profile: {
      about: "Robotics club member looking for hardware projects and hackathon teams.",
      contactNumber: 9000000008,
      department: "Demo Electronics and Communication Engineering",
      graduationYear: 2026,
      skills: ["Arduino", "Embedded C", "IoT"],
      interests: ["Robotics", "Hackathons", "Open hardware"],
      visibility: "public",
    },
  },
  {
    firstName: "Vikram",
    lastName: "Singh",
    email: "vikram@universex.demo",
    role: "Student",
    college: "UniverseX School of Design",
    gender: "Male",
    dateOfBirth: "2004-07-14",
    balance: 11000,
    profile: {
      about: "Motion design student creating assets for campus clubs and events.",
      contactNumber: 9000000009,
      department: "Animation and Interaction Design",
      graduationYear: 2027,
      skills: ["After Effects", "Illustrator", "Storyboarding"],
      interests: ["Film club", "Brand design", "Freelance projects"],
      visibility: "public",
    },
  },
];

const dummyJobs = [
  {
    postedByEmail: "professor@universex.demo",
    title: "AI Research Assistant Internship",
    companyName: "UniverseX AI Lab",
    description: "Assist with dataset preparation, model evaluation, and weekly research notes for an applied AI project.",
    opportunityType: "Internship",
    jobType: "Hybrid",
    location: "Campus AI Lab",
    stipend: "Rs. 12,000/month",
    eligibility: "Open to 2nd year and above students with Python or ML basics.",
    skills: ["Python", "Machine Learning", "Research"],
    status: "open",
    lastDateToApplyOffsetDays: 21,
    registrationLink: "https://universex.demo/opportunities/ai-research-assistant",
    importantInstructions: "Attach a short GitHub or project portfolio link.",
  },
  {
    postedByEmail: "admin@universex.demo",
    title: "Campus Placement Readiness Bootcamp",
    companyName: "UniverseX Placement Cell",
    description: "A two-week placement preparation program covering aptitude, resumes, mock interviews, and group discussions.",
    opportunityType: "Other",
    jobType: "On-site",
    location: "Main Auditorium",
    stipend: "",
    eligibility: "Final and pre-final year students across all departments.",
    skills: ["Aptitude", "Communication", "Interviewing"],
    status: "open",
    lastDateToApplyOffsetDays: 14,
    registrationLink: "https://universex.demo/opportunities/placement-bootcamp",
    importantInstructions: "Seats are limited and attendance is mandatory after selection.",
  },
  {
    postedByEmail: "professor@universex.demo",
    title: "Full Stack Developer Campus Project",
    companyName: "UniVerseX Product Studio",
    description: "Build student-facing features for the campus portal using React, Node.js, MongoDB, and clean API contracts.",
    opportunityType: "Freelance",
    jobType: "Remote",
    location: "Remote",
    stipend: "Project-based stipend",
    eligibility: "Students with at least one deployed web project.",
    skills: ["React", "Node.js", "MongoDB"],
    status: "open",
    lastDateToApplyOffsetDays: 30,
    registrationLink: "https://universex.demo/opportunities/full-stack-campus-project",
    importantInstructions: "Shortlisted students will complete a small feature task.",
  },
  {
    postedByEmail: "admin@universex.demo",
    title: "Women in Tech Scholarship",
    companyName: "UniverseX Foundation",
    description: "Scholarship support for students pursuing computing, electronics, design technology, or analytics tracks.",
    opportunityType: "Scholarship",
    jobType: "Hybrid",
    location: "Campus and online",
    stipend: "Rs. 50,000 grant",
    eligibility: "Applicants must submit academic records and a statement of purpose.",
    skills: ["Leadership", "Academics", "Community"],
    status: "open",
    lastDateToApplyOffsetDays: 45,
    registrationLink: "https://universex.demo/opportunities/women-in-tech-scholarship",
    importantInstructions: "Keep documents ready before starting the form.",
  },
];

const dummyCourses = [
  {
    professorEmail: "professor@universex.demo",
    title: "Data Structures and Algorithms",
    code: "CS301",
    description: "Core problem-solving course covering arrays, trees, graphs, dynamic programming, and interview-style implementation practice.",
    college: "UniverseX Institute of Technology",
    department: "Demo Computer Science Engineering",
    semester: "5",
    academicYear: "2026-2027",
    section: "A",
    enrollmentPolicy: "open",
    joinCode: "CS301A",
    studentEmails: ["student@universex.demo", "rohan@universex.demo"],
  },
  {
    professorEmail: "prof.kabir@universex.demo",
    title: "Applied Machine Learning",
    code: "CS451",
    description: "Project-based machine learning course with datasets, model evaluation, deployment basics, and responsible AI discussions.",
    college: "UniverseX Institute of Technology",
    department: "Demo Computer Science Engineering",
    semester: "7",
    academicYear: "2026-2027",
    section: "ML",
    enrollmentPolicy: "open",
    joinCode: "CS451M",
    studentEmails: ["student@universex.demo", "meera@universex.demo", "rohan@universex.demo"],
  },
  {
    professorEmail: "prof.nisha@universex.demo",
    title: "Embedded Systems Lab",
    code: "EC210",
    description: "Hands-on lab course for microcontrollers, sensor integration, timers, interrupts, and IoT prototype workflows.",
    college: "UniverseX Institute of Technology",
    department: "Demo Electronics and Communication Engineering",
    semester: "4",
    academicYear: "2026-2027",
    section: "LAB1",
    enrollmentPolicy: "open",
    joinCode: "EC210L",
    studentEmails: ["sara@universex.demo"],
  },
];

const dummyMaterials = [
  {
    courseCode: "CS301",
    title: "Week 1: Complexity and Arrays Notes",
    description: "Starter notes covering Big-O, memory tradeoffs, arrays, two pointers, and sliding window patterns.",
    type: "notes",
    externalUrl: "https://universex.demo/materials/cs301/week-1-complexity-arrays.pdf",
    tags: ["complexity", "arrays", "practice"],
    status: "published",
    resourceKind: "file",
    week: 1,
    module: "Foundations",
    topic: "Complexity analysis and array patterns",
    lectureOffsetDays: -8,
    allowDownload: true,
    pinned: true,
  },
  {
    courseCode: "CS301",
    title: "Graph Traversal Practice Set",
    description: "Professor-curated BFS and DFS questions for lab and interview preparation.",
    type: "assignment-brief",
    externalUrl: "https://universex.demo/materials/cs301/graph-traversal-practice.pdf",
    tags: ["graphs", "bfs", "dfs"],
    status: "scheduled",
    resourceKind: "file",
    week: 3,
    module: "Graphs",
    topic: "BFS and DFS practice",
    lectureOffsetDays: 4,
    releaseAtOffsetDays: 2,
    allowDownload: true,
  },
  {
    courseCode: "CS451",
    title: "ML Project Dataset Brief",
    description: "Dataset selection guide, baseline requirements, evaluation metrics, and submission rubric.",
    type: "reference",
    externalUrl: "https://universex.demo/materials/cs451/project-dataset-brief.pdf",
    tags: ["project", "datasets", "rubric"],
    status: "published",
    resourceKind: "file",
    week: 1,
    module: "Project Studio",
    topic: "Dataset selection and evaluation plan",
    lectureOffsetDays: -6,
    allowDownload: true,
    pinned: true,
  },
  {
    courseCode: "CS451",
    title: "Model Evaluation Lab Notebook",
    description: "Notebook walkthrough for train-test split, cross validation, confusion matrices, and model cards.",
    type: "lab",
    externalUrl: "https://universex.demo/materials/cs451/model-evaluation-lab.ipynb",
    tags: ["lab", "evaluation", "notebook"],
    status: "published",
    resourceKind: "link",
    week: 2,
    module: "Model Evaluation",
    topic: "Validation, metrics, and model cards",
    lectureOffsetDays: -2,
    allowDownload: true,
  },
  {
    courseCode: "EC210",
    title: "Microcontroller Pin Mapping Sheet",
    description: "Reference sheet for lab boards, GPIO pins, serial communication, and safe wiring.",
    type: "lab",
    externalUrl: "https://universex.demo/materials/ec210/pin-mapping-sheet.pdf",
    tags: ["microcontroller", "gpio", "lab"],
    status: "published",
    resourceKind: "file",
    week: 1,
    module: "Lab Setup",
    topic: "GPIO reference and safe wiring",
    lectureOffsetDays: -5,
    allowDownload: true,
    pinned: true,
  },
];

const dummyAnnouncements = [
  {
    courseCode: "CS301",
    title: "Graph lab moved to Friday",
    body: "This week's graph traversal lab will happen on Friday in Lab 2. Bring your laptop and complete the warm-up problems before class.",
    priority: "important",
    pinned: true,
  },
  {
    courseCode: "CS451",
    title: "Project proposal deadline",
    body: "Submit your ML project proposal with dataset link, problem statement, and evaluation metric by Sunday night.",
    priority: "urgent",
    pinned: true,
  },
  {
    courseCode: "EC210",
    title: "Hardware kits issued",
    body: "Embedded lab kits are issued from the electronics lab. Check your kit components before the next practical session.",
    priority: "normal",
    pinned: false,
  },
];

const dummyAssignments = [
  {
    courseCode: "CS301",
    title: "Dynamic Programming Drill",
    description: "Solve five DP problems and submit explanations for state, transition, and complexity.",
    dueOffsetDays: 9,
    totalMarks: 50,
  },
  {
    courseCode: "CS451",
    title: "Baseline Model Report",
    description: "Train a baseline model, document assumptions, and submit a short report with error analysis.",
    dueOffsetDays: 12,
    totalMarks: 40,
  },
  {
    courseCode: "EC210",
    title: "Sensor Logger Demo",
    description: "Build a temperature logger and submit code, circuit photo, and observations.",
    dueOffsetDays: 7,
    totalMarks: 30,
  },
];

const dummyAssessments = [
  {
    courseCode: "CS301",
    title: "Mid Semester Exam",
    type: "MidSem",
    maxMarks: 60,
    weightage: 25,
    description: "Published mid-semester result for algorithms and data structures.",
    grades: [
      { studentEmail: "student@universex.demo", marks: 52, grade: "A", feedback: "Strong graph answers. Revisit DP edge cases." },
      { studentEmail: "rohan@universex.demo", marks: 49, grade: "A-", feedback: "Good implementation detail. Add clearer complexity notes." },
    ],
  },
  {
    courseCode: "CS451",
    title: "Model Evaluation Quiz",
    type: "Quiz",
    maxMarks: 30,
    weightage: 10,
    description: "Published quiz result for metrics, validation, and model interpretation.",
    grades: [
      { studentEmail: "student@universex.demo", marks: 26, grade: "A", feedback: "Excellent metric selection reasoning." },
      { studentEmail: "meera@universex.demo", marks: 28, grade: "A+", feedback: "Very strong evaluation and error analysis." },
      { studentEmail: "rohan@universex.demo", marks: 24, grade: "B+", feedback: "Good score. Review calibration examples." },
    ],
  },
  {
    courseCode: "EC210",
    title: "Lab Practical 1",
    type: "Lab",
    maxMarks: 25,
    weightage: 15,
    description: "Published first lab practical result for GPIO and serial communication.",
    grades: [
      { studentEmail: "sara@universex.demo", marks: 23, grade: "A", feedback: "Clean wiring and well-commented code." },
    ],
  },
];

const dummyConnections = [
  { requesterEmail: "student@universex.demo", recipientEmail: "rohan@universex.demo" },
  { requesterEmail: "student@universex.demo", recipientEmail: "meera@universex.demo" },
  { requesterEmail: "sara@universex.demo", recipientEmail: "student@universex.demo" },
];

const dummyChats = [
  {
    type: "department",
    department: "Demo Computer Science Engineering",
    messages: [
      { senderEmail: "student@universex.demo", content: "Has anyone started the ML baseline report yet?" },
      { senderEmail: "rohan@universex.demo", content: "Yes, I shared a notebook outline after today's lab." },
      { senderEmail: "meera@universex.demo", content: "I can add an evaluation checklist for everyone." },
    ],
  },
  {
    type: "direct",
    participantEmails: ["student@universex.demo", "rohan@universex.demo"],
    messages: [
      { senderEmail: "rohan@universex.demo", content: "Want to pair on the DP drill after class?" },
      { senderEmail: "student@universex.demo", content: "Yes, let's use the graph lab room after 4 PM." },
    ],
  },
  {
    type: "direct",
    participantEmails: ["student@universex.demo", "meera@universex.demo"],
    messages: [
      { senderEmail: "meera@universex.demo", content: "I found a clean dataset for the ML project." },
      { senderEmail: "student@universex.demo", content: "Great, send it here and I will review the baseline." },
    ],
  },
];

const connectDatabase = async () => {
  const mongoUrl = process.env.MONGODB_URL;

  if (!mongoUrl) {
    throw new Error("MONGODB_URL is not configured. Add it to Backend/.env first.");
  }

  await mongoose.connect(mongoUrl);
  console.log(`Using ${getDataScope()} data scope for seed data.`);
};

const upsertDummyUser = async (userData, hashedPassword, adminUserId) => {
  const normalizedEmail = userData.email.trim().toLowerCase();
  let user = await findFixtureUser(normalizedEmail);

  let profileId = user?.additionalDetails;
  if (profileId) {
    const existingProfile = await Profile.findByIdAndUpdate(profileId, scopedPayload(userData.profile), {
      new: true,
      runValidators: true,
    });
    if (!existingProfile) {
      profileId = undefined;
    }
  }

  if (!profileId) {
    const profile = await Profile.create(scopedPayload(userData.profile));
    profileId = profile._id;
  }

  const userPayload = scopedPayload({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: normalizedEmail,
    password: hashedPassword,
    college: userData.college,
    gender: userData.gender,
    dateOfBirth: userData.dateOfBirth,
    additionalDetails: profileId,
    role: userData.role,
    active: true,
    verificationStatus: "verified",
    mustChangePassword: false,
    profileCompletionRequired: false,
    temporaryPasswordLastSetAt: null,
    balance: userData.balance,
    image: {
      ...DEFAULT_IMAGE,
      url: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
        `${userData.firstName} ${userData.lastName}`
      )}`,
    },
  });

  if (!user) {
    user = new User(userPayload);
  } else {
    user.set(userPayload);
  }

  await user.save();

  if (userData.facultyProfile) {
    const facultyProfile = await upsertFixtureRecord(
      FacultyProfile,
      { user: user._id },
      {
        ...userData.facultyProfile,
        user: user._id,
        verifiedBy: adminUserId,
        verifiedAt: new Date(),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    user.facultyProfile = facultyProfile._id;
    await user.save();
  }

  return user;
};

const seedDummyJobs = async (usersByEmail) => {
  const jobs = [];

  for (const jobData of dummyJobs) {
    const postedBy = usersByEmail.get(jobData.postedByEmail);
    if (!postedBy) continue;

    const { lastDateToApplyOffsetDays, postedByEmail, ...jobPayload } = jobData;
    const job = await upsertFixtureRecord(
      Job,
      { title: jobPayload.title, companyName: jobPayload.companyName },
      {
        ...jobPayload,
        postedBy: postedBy._id,
        lastDateToApply: daysFromNow(lastDateToApplyOffsetDays),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    jobs.push(job);
  }

  return jobs;
};

const seedDummyCourses = async (usersByEmail) => {
  const coursesByCode = new Map();

  for (const courseData of dummyCourses) {
    const professor = usersByEmail.get(courseData.professorEmail);
    if (!professor) continue;

    const enrollments = courseData.studentEmails
      .map((email) => usersByEmail.get(email))
      .filter(Boolean)
      .map((student) => ({
        student: student._id,
        status: "enrolled",
        joinedAt: daysFromNow(-14),
      }));

    const { professorEmail, studentEmails, ...coursePayload } = courseData;
    const course = await upsertFixtureRecord(
      Course,
      {
        code: coursePayload.code,
        college: coursePayload.college,
        section: coursePayload.section,
        academicYear: coursePayload.academicYear,
      },
      {
        ...coursePayload,
        code: coursePayload.code.toUpperCase(),
        professor: professor._id,
        enrollments,
        status: "active",
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    coursesByCode.set(course.code, course);
  }

  return coursesByCode;
};

const seedDummyMaterials = async (coursesByCode) => {
  const materials = [];

  for (const materialData of dummyMaterials) {
    const course = coursesByCode.get(materialData.courseCode);
    if (!course) continue;

    const { courseCode, lectureOffsetDays = -3, releaseAtOffsetDays = -3, ...materialPayload } = materialData;
    const material = await upsertFixtureRecord(
      CourseMaterial,
      { course: course._id, title: materialPayload.title },
      {
        ...materialPayload,
        course: course._id,
        uploadedBy: course.professor,
        visibility: "enrolled",
        lectureDate: daysFromNow(lectureOffsetDays),
        releaseAt: daysFromNow(releaseAtOffsetDays),
        publishedAt: daysFromNow(releaseAtOffsetDays),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    materials.push(material);
  }

  return materials;
};

const seedDummyAnnouncements = async (coursesByCode) => {
  const announcements = [];

  for (const announcementData of dummyAnnouncements) {
    const course = coursesByCode.get(announcementData.courseCode);
    if (!course) continue;

    const { courseCode, ...announcementPayload } = announcementData;
    const announcement = await upsertFixtureRecord(
      CourseAnnouncement,
      { course: course._id, title: announcementPayload.title },
      {
        ...announcementPayload,
        course: course._id,
        author: course.professor,
        visibility: "enrolled",
        publishedAt: daysFromNow(-2),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    announcements.push(announcement);
  }

  return announcements;
};

const seedDummyAssignments = async (coursesByCode) => {
  const assignments = [];

  for (const assignmentData of dummyAssignments) {
    const course = coursesByCode.get(assignmentData.courseCode);
    if (!course) continue;

    const { courseCode, dueOffsetDays, ...assignmentPayload } = assignmentData;
    const assignment = await upsertFixtureRecord(
      Assignment,
      { course: course._id, title: assignmentPayload.title },
      {
        ...assignmentPayload,
        course: course._id,
        professor: course.professor,
        dueDate: daysFromNow(dueOffsetDays),
        status: "published",
        visibility: "enrolled",
        publishedAt: daysFromNow(-1),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    assignments.push(assignment);
  }

  return assignments;
};

const seedDummyResults = async (coursesByCode, usersByEmail) => {
  const assessments = [];
  const gradeRecords = [];

  for (const assessmentData of dummyAssessments) {
    const course = coursesByCode.get(assessmentData.courseCode);
    if (!course) continue;

    const { courseCode, grades, ...assessmentPayload } = assessmentData;
    const publishedAt = daysFromNow(-1);
    const assessment = await upsertFixtureRecord(
      Assessment,
      { course: course._id, title: assessmentPayload.title },
      {
        ...assessmentPayload,
        course: course._id,
        professor: course.professor,
        status: "published",
        visibleFrom: daysFromNow(-1),
        publishedAt,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    assessments.push(assessment);

    for (const gradeData of grades) {
      const student = usersByEmail.get(gradeData.studentEmail);
      if (!student) continue;

      const { studentEmail, ...gradePayload } = gradeData;
      const gradeRecord = await upsertFixtureRecord(
        GradeRecord,
        { assessment: assessment._id, student: student._id },
        {
          ...gradePayload,
          assessment: assessment._id,
          course: course._id,
          student: student._id,
          publishedAt,
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );

      gradeRecords.push(gradeRecord);
    }
  }

  return { assessments, gradeRecords };
};

const seedDummyConnections = async (usersByEmail) => {
  const connections = [];

  for (const connectionData of dummyConnections) {
    const requester = usersByEmail.get(connectionData.requesterEmail);
    const recipient = usersByEmail.get(connectionData.recipientEmail);
    if (!requester || !recipient) continue;

    const connection = await upsertFixtureRecord(
      Connection,
      { pairKey: buildPairKey(requester._id, recipient._id) },
      {
        requester: requester._id,
        recipient: recipient._id,
        pairKey: buildPairKey(requester._id, recipient._id),
        status: "accepted",
        acceptedAt: daysFromNow(-5),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    connections.push(connection);
  }

  return connections;
};

const seedDummyChats = async (usersByEmail) => {
  const threads = [];
  const messages = [];

  for (const chatData of dummyChats) {
    let thread;

    if (chatData.type === "department") {
      thread = await upsertFixtureRecord(
        ChatThread,
        { type: "department", department: chatData.department },
        {
          type: "department",
          department: chatData.department,
          participants: [],
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } else {
      const participants = chatData.participantEmails
        .map((email) => usersByEmail.get(email))
        .filter(Boolean);
      if (participants.length !== 2) continue;

      const pairKey = buildPairKey(participants[0]._id, participants[1]._id);
      thread = await upsertFixtureRecord(
        ChatThread,
        { type: "direct", pairKey },
        {
          type: "direct",
          pairKey,
          participants: participants.map((participant) => participant._id),
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }

    threads.push(thread);

    for (const messageData of chatData.messages) {
      const sender = usersByEmail.get(messageData.senderEmail);
      if (!sender) continue;

      const message = await upsertFixtureRecord(
        ChatMessage,
        {
          thread: thread._id,
          sender: sender._id,
          content: messageData.content,
        },
        {
          thread: thread._id,
          sender: sender._id,
          content: messageData.content,
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );

      messages.push(message);
      thread.lastMessage = message.content;
      thread.lastMessageAt = message.createdAt || new Date();
    }

    await thread.save();
  }

  return { threads, messages };
};

const seedDummyUsersInCurrentScope = async () => {
  await connectDatabase();
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const usersByEmail = new Map();

  console.log("\nSeeding UniverseX dummy users...\n");
  const adminUserData = dummyUsers.find((user) => user.role === "Admin");
  const adminUser = await upsertDummyUser(adminUserData, hashedPassword);
  usersByEmail.set(adminUser.email, adminUser);
  console.log(`OK ${adminUser.role.padEnd(9)} ${adminUser.email}`);

  for (const userData of dummyUsers.filter((user) => user.email !== adminUserData.email)) {
    const user = await upsertDummyUser(userData, hashedPassword, adminUser._id);
    usersByEmail.set(user.email, user);
    console.log(`OK ${user.role.padEnd(9)} ${user.email}`);
  }

  console.log("\nSeeding UniverseX dummy job postings...\n");
  const jobs = await seedDummyJobs(usersByEmail);
  for (const job of jobs) {
    console.log(`OK Job       ${job.title}`);
  }

  console.log("\nSeeding UniverseX dummy courses and academics...\n");
  const coursesByCode = await seedDummyCourses(usersByEmail);
  for (const course of coursesByCode.values()) {
    console.log(`OK Course    ${course.code} - ${course.title}`);
  }

  const materials = await seedDummyMaterials(coursesByCode);
  for (const material of materials) {
    console.log(`OK Material  ${material.title}`);
  }

  const announcements = await seedDummyAnnouncements(coursesByCode);
  for (const announcement of announcements) {
    console.log(`OK Notice    ${announcement.title}`);
  }

  const assignments = await seedDummyAssignments(coursesByCode);
  for (const assignment of assignments) {
    console.log(`OK Task      ${assignment.title}`);
  }

  const { assessments, gradeRecords } = await seedDummyResults(coursesByCode, usersByEmail);
  for (const assessment of assessments) {
    console.log(`OK Result    ${assessment.title}`);
  }
  console.log(`OK Grades    ${gradeRecords.length} published grade records`);

  console.log("\nSeeding UniverseX dummy chats...\n");
  const connections = await seedDummyConnections(usersByEmail);
  console.log(`OK Network   ${connections.length} accepted connections`);

  const { threads, messages } = await seedDummyChats(usersByEmail);
  console.log(`OK Chats     ${threads.length} threads and ${messages.length} messages`);

  console.log("\nDemo credentials:");
  for (const userData of dummyUsers) {
    console.log(`- ${userData.role.padEnd(9)} ${userData.email} / ${DEFAULT_PASSWORD}`);
  }
  console.log(`\nProfessor credential to try: prof.kabir@universex.demo / ${DEFAULT_PASSWORD}`);
  console.log("\nYou can rerun this command anytime; it updates the same demo users, jobs, courses, materials, assignments, results, and chats.\n");
};

const seedDummyUsers = async ({ dataScope = process.env.SEED_DATA_SCOPE || DATA_SCOPES.PRODUCTION } = {}) =>
  runWithDataScope(dataScope, seedDummyUsersInCurrentScope);

if (require.main === module) {
  seedDummyUsers()
    .catch((error) => {
      console.error("Failed to seed dummy data:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

module.exports = {
  DEFAULT_PASSWORD,
  dummyUsers,
  seedDummyUsers,
};
