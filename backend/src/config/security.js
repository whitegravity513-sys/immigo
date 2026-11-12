import env from "./env.js";

const parseOriginUrl = (rawOrigin) => {
  try {
    return new URL(String(rawOrigin || "").trim());
  } catch {
    return null;
  }
};

const isVestaHost = (hostname = "") =>
  hostname === "vesta.in" || hostname.endsWith(".vesta.in");

export const isAllowedCorsOrigin = (origin) => {
  if (!origin) return true;
  const cleanOrigin = String(origin).trim().replace(/\/+$/, "");
  if (env.ALLOWED_ORIGINS.includes(cleanOrigin)) return true;

  const parsed = parseOriginUrl(cleanOrigin);
  if (!parsed) return false;

  const { protocol, hostname } = parsed;
  if (protocol !== "http:" && protocol !== "https:") return false;

  if ((hostname === "localhost" || hostname === "127.0.0.1") && !env.isProduction) {
    return true;
  }

  if (isVestaHost(hostname) && (protocol === "https:" || !env.isProduction)) {
    return true;
  }

  if (
    protocol === "https:" &&
    (hostname.endsWith(".vercel.app") || hostname.endsWith(".onrender.com"))
  ) {
    return true;
  }

  return false;
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedCorsOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
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

const isRequestVestaOrigin = (req) => {
  if (isVestaHost(req?.hostname)) return true;
  const parsed = parseOriginUrl(req?.headers?.origin);
  return Boolean(parsed && isVestaHost(parsed.hostname));
};

export const getCookieOptions = (req) => {
  const isProd = env.isProduction || isRequestVestaOrigin(req);

  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };

  if (isProd && isVestaHost(req?.hostname)) {
    options.domain = ".vesta.in";
  }

  return options;
};

export const getClearCookieOptions = (req) => {
  const isProd = env.isProduction || isRequestVestaOrigin(req);

  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  };

  if (isProd && isVestaHost(req?.hostname)) {
    options.domain = ".vesta.in";
  }

  return options;
};
