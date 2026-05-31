const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/userSchema");
const Profile = require("../models/profileSchema");

const DEFAULT_PASSWORD = "Password@123";
const DEFAULT_IMAGE = {
  url: "https://api.dicebear.com/8.x/initials/svg?seed=UniverseX",
  publicId: "dummy-user-avatar",
  format: "svg",
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
      department: "Computer Science",
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
];

const connectDatabase = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is not configured. Add it to Backend/.env first.");
  }

  await mongoose.connect(process.env.MONGODB_URL);
};

const upsertDummyUser = async (userData, hashedPassword) => {
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
  return user;
};

const seedDummyUsers = async () => {
  await connectDatabase();
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  console.log("\n🌱 Seeding UniverseX dummy users...\n");
  for (const userData of dummyUsers) {
    const user = await upsertDummyUser(userData, hashedPassword);
    console.log(`✅ ${user.role.padEnd(7)} ${user.email}`);
  }

  console.log("\nDemo credentials:");
  for (const userData of dummyUsers) {
    console.log(`- ${userData.role.padEnd(7)} ${userData.email} / ${DEFAULT_PASSWORD}`);
  }
  console.log("\nYou can rerun this command anytime; it updates the same demo users.\n");
};

seedDummyUsers()
  .catch((error) => {
    console.error("❌ Failed to seed dummy users:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
