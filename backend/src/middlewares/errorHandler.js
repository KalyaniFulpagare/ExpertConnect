import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 11000) {
    return res.status(StatusCodes.CONFLICT).json({
      message: "This slot has already been booked by another user."
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed.",
      details: Object.values(error.errors).map((item) => item.message)
    });
  }

  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  return res.status(statusCode).json({
    message: error.message || "Something went wrong.",
    details: error.details || null
  });
};
