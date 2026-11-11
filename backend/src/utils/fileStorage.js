import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ApiError } from "./apiError.js";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const SUBDIRS = ["profiles", "documents", "receipts"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_EXT = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx"]);

for (const dir of SUBDIRS) {
  const fullPath = path.join(UPLOAD_ROOT, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

export function saveBase64File(dataUrl, subDir = "documents", originalName = "") {
  if (!dataUrl || typeof dataUrl !== "string") return "";

  if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://") || dataUrl.startsWith("/uploads/")) {
    return dataUrl;
  }

  const safeSubDir = String(subDir || "documents").trim();
  if (!SUBDIRS.includes(safeSubDir)) {
    throw new ApiError(400, "Invalid upload directory.");
  }

  const match = dataUrl.match(/^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/s);
  const mimeType = match ? String(match[1]).trim().toLowerCase() : "";
  const base64Data = match ? match[2].trim() : dataUrl.trim();

  if (mimeType && (mimeType.includes("svg") || mimeType.includes("html") || mimeType.includes("javascript"))) {
    throw new ApiError(400, "Unsupported file format.");
  }
  if (mimeType && !ALLOWED_MIME_EXT[mimeType] && mimeType !== "application/octet-stream") {
    throw new ApiError(400, "Unsupported file format. Only PDF, JPG, PNG, WEBP, DOC, and DOCX are allowed.");
  }

  let ext = ALLOWED_MIME_EXT[mimeType] || "";
  if (!ext && originalName) {
    const candExt = path.extname(String(originalName)).trim().toLowerCase();
    if (ALLOWED_EXTENSIONS.has(candExt)) {
      ext = candExt === ".jpeg" ? ".jpg" : candExt;
    }
  }

  if (!ext) {
    throw new ApiError(400, "Unsupported file format. Only PDF, JPG, PNG, WEBP, DOC, and DOCX are allowed.");
  }

  const buffer = Buffer.from(base64Data, "base64");
  if (!buffer.length || buffer.length > MAX_FILE_BYTES) {
    throw new ApiError(400, "Uploaded file must be between 1 byte and 10 MB.");
  }

  const randomHash = crypto.randomBytes(8).toString("hex");
  const fileName = `${Date.now()}-${randomHash}${ext}`;
  const targetDir = path.resolve(UPLOAD_ROOT, safeSubDir);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.resolve(targetDir, fileName);
  if (!filePath.startsWith(`${targetDir}${path.sep}`)) {
    throw new ApiError(400, "Invalid upload path.");
  }

  fs.writeFileSync(filePath, buffer);
  return `/uploads/${safeSubDir}/${fileName}`;
}

export default {
  saveBase64File,
};
