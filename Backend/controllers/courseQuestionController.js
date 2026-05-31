const Course = require("../models/courseSchema");
const CourseQuestion = require("../models/courseQuestionSchema");
const CourseAnswer = require("../models/courseAnswerSchema");
const { createNotification } = require("../utils/notificationService");

const QUESTION_POPULATE = [
  { path: "askedBy", select: "firstName lastName image role" },
  { path: "acceptedAnswer" },
];
const ANSWER_POPULATE = [{ path: "answeredBy", select: "firstName lastName image role facultyProfile", populate: { path: "facultyProfile" } }];

const isCourseInstructor = (course, userId) =>
  String(course.professor?._id || course.professor) === String(userId) ||
  (course.coInstructors || []).some((instructor) => String(instructor?._id || instructor) === String(userId));

const getEnrollment = (course, userId) =>
  (course.enrollments || []).find((item) => String(item.student?._id || item.student) === String(userId));

const isCourseParticipant = (course, user) => user.role === "Admin" || isCourseInstructor(course, user.id) || getEnrollment(course, user.id)?.status === "enrolled";

const canViewQuestion = (course, question, user) => {
  if (user.role === "Admin" || isCourseInstructor(course, user.id)) return true;
  if (question.visibility === "private") return String(question.askedBy?._id || question.askedBy) === String(user.id);
  return getEnrollment(course, user.id)?.status === "enrolled";
};

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8);
  return String(tags || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
};

const serializeQuestion = async (question, user, course) => {
  const answers = await CourseAnswer.find({ question: question._id }).populate(ANSWER_POPULATE).sort({ official: -1, createdAt: 1 });
  const data = question.toObject ? question.toObject() : question;
  const isInstructor = user.role === "Admin" || isCourseInstructor(course, user.id);
  const isAsker = String(data.askedBy?._id || data.askedBy) === String(user.id);
  if (data.visibility === "anonymous" && !isInstructor && !isAsker) {
    data.askedBy = { firstName: "Anonymous", lastName: "Student" };
  }
  return {
    ...data,
    upvoteCount: data.upvotes?.length || 0,
    hasUpvoted: (data.upvotes || []).some((id) => String(id) === String(user.id)),
    answers: answers.map((answer) => ({
      ...(answer.toObject ? answer.toObject() : answer),
      helpfulCount: answer.helpfulBy?.length || 0,
      hasMarkedHelpful: (answer.helpfulBy || []).some((id) => String(id) === String(user.id)),
    })),
  };
};

exports.createQuestion = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!isCourseParticipant(course, req.user)) return res.status(403).json({ success: false, message: "Only course participants can ask questions" });
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();
    if (!title || !body) return res.status(400).json({ success: false, message: "Question title and body are required" });
    let question = await CourseQuestion.create({
      course: course._id,
      askedBy: req.user.id,
      title,
      body,
      tags: normalizeTags(req.body.tags),
      visibility: ["course", "anonymous", "private"].includes(req.body.visibility) ? req.body.visibility : "course",
    });
    question = await question.populate(QUESTION_POPULATE);
    const instructors = [course.professor, ...(course.coInstructors || [])].filter((id) => String(id) !== String(req.user.id));
    await Promise.all(instructors.map((recipient) => createNotification({ recipient, sender: req.user.id, course: course._id, question: question._id, type: "Academic", message: `asked a question in ${course.code}` })));
    res.status(201).json({ success: true, message: "Question posted", question: await serializeQuestion(question, req.user, course) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to post question", error: error.message });
  }
};

exports.getCourseQuestions = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!isCourseParticipant(course, req.user)) return res.status(403).json({ success: false, message: "Only course participants can view questions" });
    const { status = "", search = "" } = req.query;
    const query = { course: course._id };
    if (["open", "answered", "closed"].includes(status)) query.status = status;
    if (search.trim()) query.$text = { $search: search.trim() };
    const questions = await CourseQuestion.find(query).populate(QUESTION_POPULATE).sort({ createdAt: -1 });
    const visible = questions.filter((question) => canViewQuestion(course, question, req.user));
    const serialized = await Promise.all(visible.map((question) => serializeQuestion(question, req.user, course)));
    res.status(200).json({ success: true, questions: serialized, viewerContext: { isInstructor: req.user.role === "Admin" || isCourseInstructor(course, req.user.id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch questions", error: error.message });
  }
};

exports.createAnswer = async (req, res) => {
  try {
    const question = await CourseQuestion.findById(req.params.questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });
    const course = await Course.findById(question.course);
    if (!isCourseParticipant(course, req.user)) return res.status(403).json({ success: false, message: "Only course participants can answer" });
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ success: false, message: "Answer body is required" });
    let answer = await CourseAnswer.create({ question: question._id, course: course._id, answeredBy: req.user.id, body });
    if (req.user.role === "Admin" || isCourseInstructor(course, req.user.id)) {
      answer.official = true;
      question.acceptedAnswer = answer._id;
    }
    question.status = "answered";
    await question.save();
    answer = await answer.populate(ANSWER_POPULATE);
    if (String(question.askedBy) !== String(req.user.id)) {
      await createNotification({ recipient: question.askedBy, sender: req.user.id, course: course._id, question: question._id, answer: answer._id, type: "Academic", message: `answered your question in ${course.code}` });
    }
    const populatedQuestion = await CourseQuestion.findById(question._id).populate(QUESTION_POPULATE);
    res.status(201).json({ success: true, message: "Answer posted", question: await serializeQuestion(populatedQuestion, req.user, course) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to post answer", error: error.message });
  }
};

exports.updateQuestionStatus = async (req, res) => {
  try {
    const question = await CourseQuestion.findById(req.params.questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });
    const course = await Course.findById(question.course);
    const canManage = req.user.role === "Admin" || isCourseInstructor(course, req.user.id) || String(question.askedBy) === String(req.user.id);
    if (!canManage) return res.status(403).json({ success: false, message: "You cannot update this question" });
    if (!["open", "answered", "closed"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Valid status is required" });
    question.status = req.body.status;
    await question.save();
    const populatedQuestion = await question.populate(QUESTION_POPULATE);
    res.status(200).json({ success: true, question: await serializeQuestion(populatedQuestion, req.user, course) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update question", error: error.message });
  }
};

exports.toggleQuestionUpvote = async (req, res) => {
  try {
    const question = await CourseQuestion.findById(req.params.questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });
    const course = await Course.findById(question.course);
    if (!isCourseParticipant(course, req.user)) return res.status(403).json({ success: false, message: "Only course participants can upvote" });
    const exists = question.upvotes.some((id) => String(id) === String(req.user.id));
    question.upvotes = exists ? question.upvotes.filter((id) => String(id) !== String(req.user.id)) : [...question.upvotes, req.user.id];
    await question.save();
    const populatedQuestion = await question.populate(QUESTION_POPULATE);
    res.status(200).json({ success: true, question: await serializeQuestion(populatedQuestion, req.user, course) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update upvote", error: error.message });
  }
};

exports.markAnswerOfficial = async (req, res) => {
  try {
    const answer = await CourseAnswer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ success: false, message: "Answer not found" });
    const course = await Course.findById(answer.course);
    if (!(req.user.role === "Admin" || isCourseInstructor(course, req.user.id))) return res.status(403).json({ success: false, message: "Only instructors can mark official answers" });
    await CourseAnswer.updateMany({ question: answer.question }, { official: false });
    answer.official = true;
    await answer.save();
    const question = await CourseQuestion.findByIdAndUpdate(answer.question, { status: "answered", acceptedAnswer: answer._id }, { new: true }).populate(QUESTION_POPULATE);
    await createNotification({ recipient: question.askedBy, sender: req.user.id, course: course._id, question: question._id, answer: answer._id, type: "Academic", message: `marked an official answer in ${course.code}` });
    res.status(200).json({ success: true, question: await serializeQuestion(question, req.user, course) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark official answer", error: error.message });
  }
};

exports.toggleAnswerHelpful = async (req, res) => {
  try {
    const answer = await CourseAnswer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ success: false, message: "Answer not found" });
    const course = await Course.findById(answer.course);
    if (!isCourseParticipant(course, req.user)) return res.status(403).json({ success: false, message: "Only course participants can vote" });
    const exists = answer.helpfulBy.some((id) => String(id) === String(req.user.id));
    answer.helpfulBy = exists ? answer.helpfulBy.filter((id) => String(id) !== String(req.user.id)) : [...answer.helpfulBy, req.user.id];
    await answer.save();
    const question = await CourseQuestion.findById(answer.question).populate(QUESTION_POPULATE);
    res.status(200).json({ success: true, question: await serializeQuestion(question, req.user, course) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update helpful vote", error: error.message });
  }
};