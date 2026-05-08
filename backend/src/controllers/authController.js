import { StatusCodes } from "http-status-codes";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { createAuthToken, hashPassword, sanitizeUser, verifyPassword } from "../utils/auth.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;

const issueAuthResponse = (res, statusCode, user, message) => {
  res.status(statusCode).json({
    message,
    token: createAuthToken(user),
    user: sanitizeUser(user)
  });
};

export const signup = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const errors = [];

  if (!emailPattern.test(email)) {
    errors.push("A valid email address is required.");
  }

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long.");
  }

  if (errors.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Validation failed.", errors);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "An account with this email already exists.");
  }

  const { salt, passwordHash } = hashPassword(password);
  const user = await User.create({
    email,
    name: "",
    phone: "",
    profileCompleted: false,
    passwordSalt: salt,
    passwordHash
  });

  issueAuthResponse(res, StatusCodes.CREATED, user, "Account created successfully.");
};

export const login = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!emailPattern.test(email) || !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email and password are required.");
  }

  const user = await User.findOne({ email });

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Incorrect email or password.");
  }

  issueAuthResponse(res, StatusCodes.OK, user, "Logged in successfully.");
};

export const getCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({
    user: sanitizeUser(req.user)
  });
};

export const updateCurrentUser = async (req, res) => {
  const name = String(req.body.name ?? req.user.name).trim();
  const phone = String(req.body.phone ?? req.user.phone ?? "").trim();
  const preferredLanguage = String(
    req.body.preferredLanguage ?? req.user.preferredLanguage ?? "en"
  ).trim();
  const errors = [];

  if (name.length < 2) {
    errors.push("Name must be at least 2 characters long.");
  }

  if (phone && !phonePattern.test(phone)) {
    errors.push("A valid phone number is required.");
  }

  if (!preferredLanguage) {
    errors.push("A preferred language is required.");
  }

  if (errors.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Validation failed.", errors);
  }

  req.user.name = name;
  req.user.phone = phone;
  req.user.preferredLanguage = preferredLanguage;
  req.user.profileCompleted = Boolean(name && phone);
  await req.user.save();

  res.status(StatusCodes.OK).json({
    message: "Profile updated successfully.",
    user: sanitizeUser(req.user)
  });
};
