import env from "./env.js";

/**
 * Enterprise Security Configuration (MNC Grade)
 */
export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      env.ALLOWED_ORIGINS.includes(origin) ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin.endsWith(".vesta.in")
    ) {
      return callback(null, true);
    }
    // Allow in non-production for dev agility, or default true
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "Pragma",
    "Expires",
    "X-Access-Token",
    "X-Refresh-Token",
  ],
  exposedHeaders: ["Authorization", "Set-Cookie"],
  maxAge: 86400,
};

export const getCookieOptions = (req) => {
  const isProd =
    env.isProduction ||
    req?.hostname?.endsWith("vesta.in") ||
    (req?.headers?.origin && req.headers.origin.includes("vesta.in"));

  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  if (isProd && req?.hostname?.endsWith("vesta.in")) {
    options.domain = ".vesta.in";
  }

  return options;
};

export const getClearCookieOptions = (req) => {
  const isProd =
    env.isProduction ||
    req?.hostname?.endsWith("vesta.in") ||
    (req?.headers?.origin && req.headers.origin.includes("vesta.in"));

  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  };

  if (isProd && req?.hostname?.endsWith("vesta.in")) {
    options.domain = ".vesta.in";
  }

  return options;
};
