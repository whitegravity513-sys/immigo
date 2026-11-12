const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function sanitizeClone(value, seen = new WeakMap()) {
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const arr = [];
    seen.set(value, arr);
    for (let i = 0; i < value.length; i += 1) {
      arr.push(sanitizeClone(value[i], seen));
    }
    return arr;
  }

  const out = {};
  seen.set(value, out);
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key) || key.startsWith("$") || key.includes(".")) {
      continue;
    }
    out[key] = sanitizeClone(value[key], seen);
  }
  return out;
}

function sanitizeInPlace(target, seen = new WeakSet()) {
  if (!target || typeof target !== "object") return;
  if (seen.has(target)) return;
  seen.add(target);

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i += 1) {
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
    const rawQuery = req.query;
    if (rawQuery && typeof rawQuery === "object") {
      const cleanQuery = sanitizeClone(rawQuery);
      Object.defineProperty(req, "query", {
        value: cleanQuery,
        enumerable: true,
        configurable: true,
        writable: true,
      });
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
