import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const SUBDIRS = ["profiles", "documents", "receipts"];
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

  const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  let mimeType = "application/octet-stream";
  let base64Data = dataUrl;

  if (match) {
    mimeType = match[1];
    base64Data = match[2];
  }

  let ext = ".bin";
  if (mimeType.includes("pdf")) ext = ".pdf";
  else if (mimeType.includes("png")) ext = ".png";
  else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = ".jpg";
  else if (mimeType.includes("webp")) ext = ".webp";
  else if (mimeType.includes("svg")) ext = ".svg";
  else if (originalName && path.extname(originalName)) {
    ext = path.extname(originalName);
  }

  const randomHash = crypto.randomBytes(8).toString("hex");
  const fileName = `${Date.now()}-${randomHash}${ext}`;
  const targetDir = path.join(UPLOAD_ROOT, subDir);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, fileName);
  const buffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${subDir}/${fileName}`;
}

export default {
  saveBase64File,
};
