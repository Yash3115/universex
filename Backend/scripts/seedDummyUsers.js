const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const FacultyProfile = require("../models/facultyProfileSchema");
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
      department: "Computer Science Engineering",
      graduationYear: 2010,
      skills: ["Machine Learning", "Data Structures", "Research Mentoring"],
      interests: ["Applied AI", "Student research", "Career guidance"],
      visibility: "public",
    },
    facultyProfile: {
      employeeId: "UX-FAC-101",
      designation: "Associate Professor",
      department: "Computer Science Engineering",
      officeLocation: "Block B, Room 304",
      bio: "Mentors capstone teams and coordinates industry-backed AI projects.",
      researchAreas: ["Responsible AI", "Learning analytics", "Human-centered computing"],
      website: "https://universex.demo/faculty/ananya-rao",
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
      department: "Computer Science Engineering",
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
      department: "Computer Science Engineering",
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
      department: "Electronics and Communication Engineering",
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

const connectDatabase = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is not configured. Add it to Backend/.env first.");
  }

  await mongoose.connect(process.env.MONGODB_URL);
};

const upsertDummyUser = async (userData, hashedPassword, adminUserId) => {
  const normalizedEmail = userData.email.trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  let profileId = user?.additionalDetails;
  if (profileId) {
    const existingProfile = await Profile.findByIdAndUpdate(profileId, userData.profile, {
      new: true,
      runValidators: true,
    });
    if (!existingProfile) {
      profileId = undefined;
    }
  }

  if (!profileId) {
    const profile = await Profile.create(userData.profile);
    profileId = profile._id;
  }

  const userPayload = {
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
    balance: userData.balance,
    image: {
      ...DEFAULT_IMAGE,
      url: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
        `${userData.firstName} ${userData.lastName}`
      )}`,
    },
  };

  if (!user) {
    user = new User(userPayload);
  } else {
    user.set(userPayload);
  }

  await user.save();

  if (userData.facultyProfile) {
    const facultyProfile = await FacultyProfile.findOneAndUpdate(
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
    const job = await Job.findOneAndUpdate(
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

const seedDummyUsers = async () => {
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

  console.log("\nDemo credentials:");
  for (const userData of dummyUsers) {
    console.log(`- ${userData.role.padEnd(9)} ${userData.email} / ${DEFAULT_PASSWORD}`);
  }
  console.log("\nYou can rerun this command anytime; it updates the same demo users and jobs.\n");
};

seedDummyUsers()
  .catch((error) => {
    console.error("Failed to seed dummy data:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
