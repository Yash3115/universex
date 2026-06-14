const isProfessorVerified = (user) =>
  user?.role === "Professor" && user?.verificationStatus !== "rejected";

const normalizeId = (value) => String(value?._id || value?.id || value || "");

const isCourseInstructor = (course, userId) => {
  const viewerId = normalizeId(userId);
  if (!viewerId) return false;

  return (
    normalizeId(course?.professor) === viewerId ||
    (course?.coInstructors || []).some((instructor) => normalizeId(instructor) === viewerId)
  );
};

const getEnrollment = (course, userId) => {
  const viewerId = normalizeId(userId);
  if (!viewerId) return null;

  return (course?.enrollments || []).find(
    (item) => normalizeId(item.student) === viewerId
  ) || null;
};

const isEnrolled = (course, userId) => getEnrollment(course, userId)?.status === "enrolled";

const canManageCourse = (course, user) =>
  user?.role === "Admin" || isCourseInstructor(course, user?._id || user?.id);

const canCreateCourse = (user) => user?.role === "Admin" || isProfessorVerified(user);

module.exports = {
  canCreateCourse,
  canManageCourse,
  getEnrollment,
  isCourseInstructor,
  isEnrolled,
  isProfessorVerified,
  normalizeId,
};
