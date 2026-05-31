export const getImageUrl = (image, fallback = "") => {
  if (!image) return fallback;
  if (typeof image === "string") return image;
  return image.url || fallback;
};