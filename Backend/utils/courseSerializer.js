const { canManageCourse, getEnrollment, normalizeId } = require("./coursePolicy");

const safeImage = (image) => image || null;

const toPlain = (value) => (value?.toObject ? value.toObject() : value);

const serializeProfessor = (professor, canManage) => {
  const data = toPlain(professor) || {};
  const facultyProfile = toPlain(data.facultyProfile) || data.facultyProfile || null;

  return {
    _id: data._id,
    firstName: data.firstName,
    lastName: data.lastName,
    image: safeImage(data.image),
    college: data.college,
    role: data.role,
    verificationStatus: data.verificationStatus,
    facultyProfile,
    ...(canManage ? { email: data.email } : {}),
  };
};

const serializeRosterStudent = (student, canManage) => {
  const data = toPlain(student) || {};
  const profile = toPlain(data.additionalDetails) || {};

  return {
    _id: data._id,
    firstName: data.firstName,
    lastName: data.lastName,
    image: safeImage(data.image),
    college: data.college,
    additionalDetails: {
      department: profile.department || "",
      graduationYear: profile.graduationYear || "",
      visibility: profile.visibility || "public",
      ...(canManage
        ? {
            contactNumber: profile.contactNumber || "",
            about: profile.about || "",
            skills: profile.skills || [],
            interests: profile.interests || [],
          }
        : {}),
    },
    ...(canManage ? { email: data.email } : {}),
  };
};

const serializeEnrollment = (enrollment, canManage) => {
  const data = toPlain(enrollment) || {};
  return {
    status: data.status,
    joinedAt: data.joinedAt,
    student: serializeRosterStudent(data.student, canManage),
  };
};

const serializeCourse = (course, user) => {
  const data = toPlain(course) || {};
  const canManage = canManageCourse(data, user);
  const viewerId = normalizeId(user?._id || user?.id);
  const viewerEnrollment = getEnrollment(data, viewerId);

  const publicEnrollments = (data.enrollments || [])
    .filter((enrollment) => Boolean(viewerEnrollment) && (enrollment.status === "enrolled" || normalizeId(enrollment.student) === viewerId))
    .map((enrollment) => serializeEnrollment(enrollment, false));

  const fullEnrollments = (data.enrollments || []).map((enrollment) => serializeEnrollment(enrollment, true));
  const enrolledCount = (data.enrollments || []).filter((enrollment) => enrollment.status === "enrolled").length;
  const requestedCount = (data.enrollments || []).filter((enrollment) => enrollment.status === "requested").length;

  return {
    _id: data._id,
    title: data.title,
    code: data.code,
    description: data.description,
    college: data.college,
    department: data.department,
    semester: data.semester,
    academicYear: data.academicYear,
    section: data.section,
    professor: serializeProfessor(data.professor, canManage),
    coInstructors: canManage ? data.coInstructors || [] : undefined,
    enrollments: canManage ? fullEnrollments : publicEnrollments,
    enrollmentPolicy: data.enrollmentPolicy,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    enrollmentSummary: {
      enrolled: enrolledCount,
      requested: canManage ? requestedCount : undefined,
      myStatus: viewerEnrollment?.status || "none",
    },
    ...(canManage ? { joinCode: data.joinCode } : {}),
  };
};

const buildCourseViewerContext = (course, user) => {
  const canManage = canManageCourse(course, user);
  const enrollment = getEnrollment(course, user?._id || user?.id);

  return {
    isInstructor: canManage,
    canManageCourse: canManage,
    canSeeJoinCode: canManage,
    enrollmentStatus: enrollment?.status || "none",
  };
};

module.exports = {
  buildCourseViewerContext,
  serializeCourse,
};
