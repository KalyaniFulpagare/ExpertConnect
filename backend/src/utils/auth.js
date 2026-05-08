import crypto from "crypto";

const TOKEN_SEPARATOR = ".";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const getAuthSecret = () => process.env.AUTH_SECRET || "expert-session-booking-dev-secret";

const toBase64Url = (value) => Buffer.from(value).toString("base64url");

const fromBase64Url = (value) => Buffer.from(value, "base64url").toString("utf8");

const createSignature = (encodedPayload) =>
  crypto.createHmac("sha256", getAuthSecret()).update(encodedPayload).digest("base64url");

export const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return { salt, passwordHash };
};

export const verifyPassword = (password, salt, expectedHash) => {
  const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(passwordHash), Buffer.from(expectedHash));
};

export const createAuthToken = (user) => {
  const payload = {
    sub: String(user._id),
    email: user.email,
    exp: Date.now() + TOKEN_TTL_MS
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createSignature(encodedPayload);
  return `${encodedPayload}${TOKEN_SEPARATOR}${signature}`;
};

export const verifyAuthToken = (token) => {
  if (!token || !token.includes(TOKEN_SEPARATOR)) {
    return null;
  }

  const [encodedPayload, signature] = token.split(TOKEN_SEPARATOR);

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createSignature(encodedPayload);

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload));

    if (!payload?.sub || !payload?.email || !payload?.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

export const sanitizeUser = (user) => ({
  id: String(user._id),
  name: user.name || "",
  email: user.email,
  phone: user.phone || "",
  preferredLanguage: user.preferredLanguage || "en",
  role: user.role || "user",
  profileCompleted: Boolean(user.profileCompleted || (user.name?.trim() && user.phone?.trim()))
});
