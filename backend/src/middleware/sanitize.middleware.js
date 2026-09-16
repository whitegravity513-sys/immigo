/**
 * Enterprise NoSQL Injection & Request Sanitization Middleware (Express 5 Compatible)
 * Sanitizes req.body, req.query, and req.params in-place against malicious MongoDB operator injections.
 */

function sanitizeInPlace(target) {
  if (!target || typeof target !== "object") return;

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (typeof target[i] === "object" && target[i] !== null) {
        sanitizeInPlace(target[i]);
      }
    }
    return;
  }

  const keys = Object.keys(target);
  for (const key of keys) {
    // Strip leading dollar signs ($) or keys with dots (.) that can manipulate mongo query operators
    if (key.startsWith("$") || key.includes(".")) {
      delete target[key];
      continue;
    }

    if (typeof target[key] === "object" && target[key] !== null) {
      sanitizeInPlace(target[key]);
    }
  }
}

export const sanitizeRequests = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      sanitizeInPlace(req.body);
    }
    if (req.query && typeof req.query === "object") {
      sanitizeInPlace(req.query);
    }
    if (req.params && typeof req.params === "object") {
      sanitizeInPlace(req.params);
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default sanitizeRequests;
