import { StatusCodes } from "http-status-codes";
import { User } from "../models/User.js";
import { verifyAuthToken } from "../utils/auth.js";
import { ApiError } from "../utils/ApiError.js";

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return "";
  }

  return authorizationHeader.slice("Bearer ".length).trim();
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    const payload = verifyAuthToken(token);

    if (!payload) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, "Please log in to continue."));
      return;
    }

    const user = await User.findById(payload.sub);

    if (!user) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, "Your session is no longer valid."));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    next(new ApiError(StatusCodes.FORBIDDEN, "You are not allowed to modify expert data."));
    return;
  }

  next();
};
