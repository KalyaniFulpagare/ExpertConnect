import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Expert } from "../models/Expert.js";
import { ApiError } from "../utils/ApiError.js";

const validStatuses = new Set(["Pending", "Confirmed", "Completed"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const normalizeBooking = (bookingDoc) => ({
  id: bookingDoc._id,
  expertId: bookingDoc.expert?._id || bookingDoc.expert,
  expertName: bookingDoc.expert?.name,
  expertCategory: bookingDoc.expert?.category,
  name: bookingDoc.name,
  email: bookingDoc.email,
  phone: bookingDoc.phone,
  date: bookingDoc.date,
  timeSlot: bookingDoc.timeSlot,
  notes: bookingDoc.notes,
  status: bookingDoc.status,
  createdAt: bookingDoc.createdAt,
  updatedAt: bookingDoc.updatedAt
});

const validateBookingPayload = ({ expertId, name, email, phone, date, timeSlot, notes }) => {
  const errors = [];

  if (!expertId || !mongoose.Types.ObjectId.isValid(expertId)) {
    errors.push("A valid expertId is required.");
  }

  if (!name || String(name).trim().length < 2) {
    errors.push("Name must be at least 2 characters long.");
  }

  if (!emailPattern.test(String(email || "").trim())) {
    errors.push("A valid email address is required.");
  }

  if (!phonePattern.test(String(phone || "").trim())) {
    errors.push("A valid phone number is required.");
  }

  if (!datePattern.test(String(date || "").trim())) {
    errors.push("Date must be in YYYY-MM-DD format.");
  }

  if (!timeSlot || String(timeSlot).trim().length < 3) {
    errors.push("A valid time slot is required.");
  }

  if (notes && String(notes).trim().length > 400) {
    errors.push("Notes cannot exceed 400 characters.");
  }

  return errors;
};

export const createBooking = async (req, res) => {
  const { expertId, name, email, phone, date, timeSlot, notes = "" } = req.body;
  const validationErrors = validateBookingPayload(req.body);

  if (validationErrors.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Validation failed.", validationErrors);
  }

  const expert = await Expert.findById(expertId).lean();

  if (!expert) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Expert not found.");
  }

  const daySchedule = expert.availability.find((entry) => entry.date === date);

  if (!daySchedule) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "This expert is not available on the selected date.");
  }

  if (!daySchedule.slots.includes(timeSlot)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "The selected time slot is invalid for this expert.");
  }

  const booking = await Booking.create({
    expert: expertId,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    date: String(date).trim(),
    timeSlot: String(timeSlot).trim(),
    notes: String(notes).trim()
  });

  const populatedBooking = await Booking.findById(booking._id).populate("expert", "name");

  req.io.to(`expert:${expertId}`).emit("slot:booked", {
    expertId,
    date,
    timeSlot
  });

  req.io.to(`bookings:${String(email).trim().toLowerCase()}`).emit("booking:created", {
    booking: normalizeBooking(populatedBooking)
  });

  res.status(StatusCodes.CREATED).json({
    message: "Booking created successfully.",
    booking: normalizeBooking(populatedBooking)
  });
};

export const getBookingsByEmail = async (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();

  if (!emailPattern.test(email)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "A valid email query parameter is required.");
  }

  const bookings = await Booking.find({ email })
    .populate("expert", "name category")
    .sort({ createdAt: -1 })
    .lean();

  res.status(StatusCodes.OK).json({
    data: bookings.map(normalizeBooking)
  });
};

export const getAllBookings = async (req, res) => {
  const status = String(req.query.status || "").trim();
  const query = {};

  if (status) {
    if (!validStatuses.has(status)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Status must be one of Pending, Confirmed, or Completed."
      );
    }

    query.status = status;
  }

  const bookings = await Booking.find(query)
    .populate("expert", "name category")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.status(StatusCodes.OK).json({
    data: bookings.map(normalizeBooking)
  });
};

export const updateBookingStatus = async (req, res) => {
  const status = String(req.body.status || "").trim();

  if (!validStatuses.has(status)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Status must be one of Pending, Confirmed, or Completed."
    );
  }

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate("expert", "name");

  if (!booking) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found.");
  }

  req.io.to(`bookings:${booking.email}`).emit("booking:status-updated", {
    booking: normalizeBooking(booking)
  });

  res.status(StatusCodes.OK).json({
    message: "Booking status updated successfully.",
    booking: normalizeBooking(booking)
  });
};

export const getBookingOverview = async (req, res) => {
  const [statusCounts, categoryCounts, totalBookings] = await Promise.all([
    Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Booking.aggregate([
      {
        $lookup: {
          from: "experts",
          localField: "expert",
          foreignField: "_id",
          as: "expert"
        }
      },
      { $unwind: "$expert" },
      { $group: { _id: "$expert.category", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]),
    Booking.countDocuments()
  ]);

  res.status(StatusCodes.OK).json({
    totalBookings,
    statusCounts,
    categoryCounts
  });
};
