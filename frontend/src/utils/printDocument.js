function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeDocUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("https://") ||
    lower.startsWith("http://") ||
    lower.startsWith("blob:")
  ) {
    return true;
  }
  if (lower.startsWith("data:")) {
    return (
      /^data:image\/(png|jpe?g|gif|webp|bmp);/i.test(lower) ||
      /^data:application\/pdf;/i.test(lower)
    );
  }
  return false;
}

function sanitizeHtmlFragment(element) {
  const template = document.createElement("template");
  template.innerHTML = element.innerHTML;
  const blockedTags = template.content.querySelectorAll("script, iframe, object, embed, base");
  blockedTags.forEach((node) => node.remove());
  const allNodes = template.content.querySelectorAll("*");
  allNodes.forEach((node) => {
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const val = String(attr.value || "").trim().toLowerCase();
      if (name.startsWith("on")) {
        node.removeAttribute(attr.name);
      } else if ((name === "href" || name === "src" || name === "xlink:href") && (val.startsWith("javascript:") || val.startsWith("vbscript:") || val.startsWith("data:text/html"))) {
        node.removeAttribute(attr.name);
      }
    });
  });
  return template.innerHTML;
}

export function dataUrlToBlobUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return { url: dataUrl || "", isBlob: false };
  }
  try {
    const commaIdx = dataUrl.indexOf(",");
    if (commaIdx === -1) return { url: dataUrl, isBlob: false };
    const header = dataUrl.slice(0, commaIdx);
    const body = dataUrl.slice(commaIdx + 1);
    const mimeMatch = header.match(/^data:([^;]+)/i);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";

    if (/;base64/i.test(header)) {
      const binary = atob(body);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });
      return { url: URL.createObjectURL(blob), isBlob: true };
    }

    const decoded = decodeURIComponent(body);
    const blob = new Blob([decoded], { type: mime });
    return { url: URL.createObjectURL(blob), isBlob: true };
  } catch {
    return { url: dataUrl, isBlob: false };
  }
}

function inferExtension(fileNameOrDoc = {}, docMeta = {}) {
  const nameStr = typeof fileNameOrDoc === "string" ? fileNameOrDoc : String(fileNameOrDoc.fileName || fileNameOrDoc.title || fileNameOrDoc.name || "");
  if (/\.[a-z0-9]{2,5}$/i.test(nameStr)) return "";
  const doc = typeof fileNameOrDoc === "string" ? docMeta : fileNameOrDoc;
  const url = String(doc.fileUrl || "").toLowerCase();
  const mime = String(doc.mimeType || "").toLowerCase();
  if (mime.includes("png") || url.startsWith("data:image/png")) return ".png";
  if (mime.includes("jpeg") || mime.includes("jpg") || url.startsWith("data:image/jp")) return ".jpg";
  if (mime.includes("webp") || url.startsWith("data:image/webp")) return ".webp";
  if (mime.includes("pdf") || url.startsWith("data:application/pdf")) return ".pdf";
  return ".pdf";
}

function isImageDoc(doc = {}) {
  const url = String(doc.fileUrl || "").toLowerCase();
  const mime = String(doc.mimeType || "").toLowerCase();
  const name = String(doc.fileName || doc.name || "").toLowerCase();
  return (
    url.startsWith("data:image/") ||
    mime.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url) ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)
  );
}

function isPdfDoc(doc = {}) {
  const url = String(doc.fileUrl || "").toLowerCase();
  const mime = String(doc.mimeType || "").toLowerCase();
  const name = String(doc.fileName || doc.name || "").toLowerCase();
  return (
    url.startsWith("data:application/pdf") ||
    mime === "application/pdf" ||
    /\.pdf(\?|$)/i.test(url) ||
    /\.pdf$/i.test(name)
  );
}

export function openUploadedDocument(doc) {
  if (!doc?.fileUrl || !isSafeDocUrl(doc.fileUrl)) {
    alert("Original document file is missing or uses an unsupported format.");
    return;
  }
  const { url, isBlob } = dataUrlToBlobUrl(doc.fileUrl);
  window.open(url, "_blank", "noopener,noreferrer");
  if (isBlob) {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}

export function downloadUploadedDocument(doc) {
  if (!doc?.fileUrl || !isSafeDocUrl(doc.fileUrl)) {
    alert("Original document file is missing or uses an unsupported format.");
    return;
  }
  const { url, isBlob } = dataUrlToBlobUrl(doc.fileUrl);
  const baseName = doc.fileName || doc.title || doc.name || "document";
  const ext = inferExtension(baseName, doc);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (isBlob) {
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

export async function printUploadedDocument(doc) {
  if (!doc?.fileUrl || !isSafeDocUrl(doc.fileUrl)) {
    alert("Original document file is missing or uses an unsupported format.");
    return;
  }

  const originalTitle = document.title;
  const docTitle = String(doc.fileName || doc.title || doc.name || "Document").replace(/[\r\n]/g, " ");
  document.title = docTitle;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-1";

  let createdBlobUrl = "";
  let cleaned = false;
  let fallbackTimer = null;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    if (createdBlobUrl) {
      try {
        URL.revokeObjectURL(createdBlobUrl);
      } catch {}
    }
    document.title = originalTitle;
  };

  fallbackTimer = setTimeout(cleanup, 60000);
  document.body.appendChild(iframe);

  const attachAfterPrint = () => {
    try {
      const win = iframe.contentWindow;
      if (win) {
        win.onafterprint = () => {
          setTimeout(cleanup, 800);
        };
      }
    } catch {}
  };

  const triggerPrint = () => {
    attachAfterPrint();
    try {
      const win = iframe.contentWindow;
      if (!win) throw new Error("Print window unavailable");
      win.focus();
      win.print();
    } catch {
      const targetUrl = createdBlobUrl || doc.fileUrl;
      cleanup();
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isImageDoc(doc)) {
    const idoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!idoc) {
      cleanup();
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
      return;
    }
    idoc.open();
    idoc.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${escapeHtml(docTitle)}</title><style>@page{margin:0;}html,body{margin:0;padding:0;width:100%;height:100%;background:#ffffff;display:flex;align-items:center;justify-content:center;overflow:hidden;}img{max-width:100%;max-height:100vh;width:auto;height:auto;object-fit:contain;display:block;margin:auto;}</style></head><body></body></html>`
    );
    idoc.close();

    const img = idoc.createElement("img");
    img.alt = docTitle;
    img.onload = async () => {
      if (typeof img.decode === "function") {
        try {
          await img.decode();
        } catch {}
      }
      setTimeout(triggerPrint, 120);
    };
    img.onerror = () => {
      cleanup();
      alert("Unable to load document image for printing.");
    };
    idoc.body.appendChild(img);
    img.src = doc.fileUrl;
    return;
  }

  if (isPdfDoc(doc)) {
    let pdfUrl = doc.fileUrl;
    if (pdfUrl.startsWith("data:")) {
      const res = dataUrlToBlobUrl(pdfUrl);
      pdfUrl = res.url;
      if (res.isBlob) createdBlobUrl = res.url;
    } else if (/^https?:/i.test(pdfUrl)) {
      try {
        const resp = await fetch(pdfUrl);
        if (resp.ok) {
          const blob = await resp.blob();
          createdBlobUrl = URL.createObjectURL(blob);
          pdfUrl = createdBlobUrl;
        }
      } catch {}
    }

    iframe.onload = () => {
      setTimeout(triggerPrint, 350);
    };
    iframe.onerror = () => {
      cleanup();
      openUploadedDocument(doc);
    };
    iframe.src = pdfUrl;
    return;
  }

  cleanup();
  openUploadedDocument(doc);
}

export function printHtmlElement(element, title = "Document") {
  if (!element) {
    window.print();
    return;
  }

  const originalTitle = document.title;
  const safeTitle = String(title || "Document").replace(/[\r\n]/g, " ");
  document.title = safeTitle;

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join("\n");

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-1";

  let cleaned = false;
  let fallbackTimer = null;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    document.title = originalTitle;
  };

  fallbackTimer = setTimeout(cleanup, 60000);
  document.body.appendChild(iframe);

  const idoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!idoc) {
    cleanup();
    window.print();
    return;
  }

  const safeBodyHtml = sanitizeHtmlFragment(element);
  idoc.open();
  idoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${escapeHtml(safeTitle)}</title>${styles}<style>@page{size:A4 portrait;margin:12mm 15mm;}html,body{background:#ffffff !important;margin:0 !important;padding:0 !important;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;height:auto !important;overflow:visible !important;}.doc-print-hide,.mou-print-hide,.print\\:hidden{display:none !important;}</style></head><body><div>${safeBodyHtml}</div></body></html>`);
  idoc.close();

  setTimeout(() => {
    try {
      const win = iframe.contentWindow;
      if (win) {
        win.onafterprint = () => {
          setTimeout(cleanup, 800);
        };
        win.focus();
        win.print();
      } else {
        throw new Error("Print window unavailable");
      }
    } catch {
      cleanup();
      window.print();
    }
  }, 450);
}
