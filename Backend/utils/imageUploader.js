const cloudinary = require("cloudinary").v2;

const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DEFAULT_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const validateImageFile = (file) => {
  if (!file) {
    throw new Error("Image file is required");
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }

  const maxSize = Number(process.env.MAX_IMAGE_SIZE_BYTES) || DEFAULT_MAX_IMAGE_SIZE_BYTES;
  if (file.size > maxSize) {
    throw new Error(`Image size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
  }
};

const toImageMetadata = (uploadedImage) => ({
  url: uploadedImage.secure_url,
  publicId: uploadedImage.public_id,
  width: uploadedImage.width,
  height: uploadedImage.height,
  format: uploadedImage.format,
});

const getImageUrl = (image, fallback = "") => {
  if (!image) return fallback;
  if (typeof image === "string") return image;
  return image.url || fallback;
};

const getImagePublicId = (image) => {
  if (!image || typeof image === "string") return null;
  return image.publicId || null;
};

const deleteImageFromCloudinary = async (imageOrPublicId) => {
  const publicId = typeof imageOrPublicId === "string" ? imageOrPublicId : getImagePublicId(imageOrPublicId);
  if (!publicId) return null;

  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

const uploadImageToCloudinary = async (file, folder, height, quality) => {
  validateImageFile(file);

  const options = {
    folder,
    resource_type: "image",
    fetch_format: "auto",
  };

  if (height) options.height = height;
  if (quality) options.quality = quality;

  const uploadedImage = await cloudinary.uploader.upload(file.tempFilePath, options);
  return toImageMetadata(uploadedImage);
};

module.exports = {
  deleteImageFromCloudinary,
  getImagePublicId,
  getImageUrl,
  toImageMetadata,
  uploadImageToCloudinary,
  validateImageFile,
};