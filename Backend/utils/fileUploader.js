const cloudinary = require("cloudinary").v2;

const DEFAULT_MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const ALLOWED_FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const validateCourseFile = (file) => {
  if (!file) throw new Error("File is required");

  if (!ALLOWED_FILE_MIME_TYPES.includes(file.mimetype)) {
    throw new Error("Unsupported file type. Upload PDF, Word, PPT, Excel, CSV, TXT, ZIP, or image files.");
  }

  const maxSize = Number(process.env.MAX_COURSE_FILE_SIZE_BYTES) || DEFAULT_MAX_FILE_SIZE_BYTES;
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
  }
};

const uploadCourseFileToCloudinary = async (file, folder = "course-materials") => {
  validateCourseFile(file);

  const uploadedFile = await cloudinary.uploader.upload(file.tempFilePath, {
    folder,
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
  });

  return {
    url: uploadedFile.secure_url,
    publicId: uploadedFile.public_id,
    resourceType: uploadedFile.resource_type,
    format: uploadedFile.format || "",
    bytes: uploadedFile.bytes || file.size,
    originalName: file.name || "course-material",
    mimeType: file.mimetype,
  };
};

const deleteCourseFileFromCloudinary = async (file = {}) => {
  if (!file.publicId) return null;
  return cloudinary.uploader.destroy(file.publicId, { resource_type: file.resourceType || "raw" });
};

module.exports = {
  ALLOWED_FILE_MIME_TYPES,
  deleteCourseFileFromCloudinary,
  uploadCourseFileToCloudinary,
  validateCourseFile,
};