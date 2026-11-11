const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function sanitizeInPlace(target, seen = new WeakSet()) {
  if (!target || typeof target !== "object") return;
  if (seen.has(target)) return;
  seen.add(target);

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (typeof target[i] === "object" && target[i] !== null) {
        sanitizeInPlace(target[i], seen);
      }
    }
    return;
  }

  if (Object.prototype.hasOwnProperty.call(target, "__proto__")) {
    delete target.__proto__;
  }

  const keys = Object.keys(target);
  for (const key of keys) {
    if (DANGEROUS_KEYS.has(key) || key.startsWith("$") || key.includes(".")) {
      delete target[key];
      continue;
    }

    if (typeof target[key] === "object" && target[key] !== null) {
      sanitizeInPlace(target[key], seen);
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
