export function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createSafeSearchRegex(value = "", flags = "i") {
  const cleaned = String(value || "").trim();
  if (!cleaned) return null;
  return new RegExp(escapeRegex(cleaned), flags);
}

export default escapeRegex;

