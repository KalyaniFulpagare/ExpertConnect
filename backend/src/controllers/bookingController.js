import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Expert } from "../models/Expert.js";
import { WaitlistEntry } from "../models/WaitlistEntry.js";
import { ApiError } from "../utils/ApiError.js";

const validStatuses = new Set(["Pending", "Confirmed", "Completed", "Cancelled"]);
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
  previousSlot: bookingDoc.previousSlot,
  cancellationReason: bookingDoc.cancellationReason,
  createdAt: bookingDoc.createdAt,
  updatedAt: bookingDoc.updatedAt
});

const normalizeWaitlistEntry = (entry) => ({
  id: entry._id,
  expertId: entry.expert?._id || entry.expert,
  expertName: entry.expert?.name,
  email: entry.email,
  name: entry.name,
  date: entry.date,
  timeSlot: entry.timeSlot,
  notes: entry.notes,
  status: entry.status,
  createdAt: entry.createdAt
});

const ensureBookingOwner = (booking, user) => {
  if (booking.email !== user.email) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only manage your own bookings.");
  }
};

const ensureExpertHasSlot = (expert, date, timeSlot) => {
  const daySchedule = expert.availability.find((entry) => entry.date === date);

  if (!daySchedule) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This expert is not available on the selected date."
    );
  }

  if (!daySchedule.slots.includes(timeSlot)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "The selected time slot is invalid for this expert."
    );
  }
};

const notifyWaitlistForSlot = async (io, expertId, date, timeSlot) => {
  const matchingEntries = await WaitlistEntry.find({
    expert: expertId,
    date,
    timeSlot,
    status: "Waiting"
  });

  for (const entry of matchingEntries) {
    entry.status = "Notified";
    await entry.save();

    io.to(`bookings:${entry.email}`).emit("waitlist:slot-opened", {
      waitlistEntry: normalizeWaitlistEntry(entry)
    });
  }
};

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
  const name = String(req.body.name || req.user.name || "").trim();
  const email = String(req.user.email || "").trim().toLowerCase();
  const phone = String(req.body.phone || req.user.phone || "").trim();
  const date = String(req.body.date || "").trim();
  const timeSlot = String(req.body.timeSlot || "").trim();
  const notes = String(req.body.notes || "").trim();
  const expertId = req.body.expertId;
  const validationErrors = validateBookingPayload({
    expertId,
    name,
    email,
    phone,
    date,
    timeSlot,
    notes
  });

  if (validationErrors.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Validation failed.", validationErrors);
  }

  const expert = await Expert.findById(expertId).lean();

  if (!expert) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Expert not found.");
  }

  ensureExpertHasSlot(expert, date, timeSlot);

  const booking = await Booking.create({
    expert: expertId,
    name,
    email,
    phone,
    date,
    timeSlot,
    notes
  });

  if (req.user.name !== name || req.user.phone !== phone) {
    req.user.name = name;
    req.user.phone = phone;
    await req.user.save();
  }

  await WaitlistEntry.updateMany(
    {
      expert: expertId,
      date,
      timeSlot,
      email
    },
    {
      status: "Converted"
    }
  );

  const populatedBooking = await Booking.findById(booking._id).populate("expert", "name category");

  req.io.to(`expert:${expertId}`).emit("slot:booked", {
    expertId,
    date,
    timeSlot
  });

  req.io.to(`bookings:${email}`).emit("booking:created", {
    booking: normalizeBooking(populatedBooking)
  });

  res.status(StatusCodes.CREATED).json({
    message: "Booking created successfully.",
    booking: normalizeBooking(populatedBooking)
  });
};

export const getBookingsByEmail = async (req, res) => {
  const email = String(req.user.email || "").trim().toLowerCase();

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

  if (status === "Cancelled") {
    req.io.to(`expert:${booking.expert._id}`).emit("slot:released", {
      expertId: booking.expert._id,
      date: booking.date,
      timeSlot: booking.timeSlot
    });
    await notifyWaitlistForSlot(req.io, booking.expert._id, booking.date, booking.timeSlot);
  }

  res.status(StatusCodes.OK).json({
    message: "Booking status updated successfully.",
    booking: normalizeBooking(booking)
  });
};

export const getBookingOverview = async (req, res) => {
  const [statusCounts, categoryCounts, totalBookings, waitlistCount] = await Promise.all([
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
    Booking.countDocuments(),
    WaitlistEntry.countDocuments()
  ]);

  res.status(StatusCodes.OK).json({
    totalBookings,
    waitlistCount,
    statusCounts,
    categoryCounts
  });
};

export const cancelBooking = async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  const booking = await Booking.findById(req.params.id).populate("expert", "name category");

  if (!booking) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found.");
  }

  ensureBookingOwner(booking, req.user);

  booking.status = "Cancelled";
  booking.cancellationReason = reason;
  await booking.save();

  req.io.to(`bookings:${booking.email}`).emit("booking:status-updated", {
    booking: normalizeBooking(booking)
  });
  req.io.to(`expert:${booking.expert._id}`).emit("slot:released", {
    expertId: booking.expert._id,
    date: booking.date,
    timeSlot: booking.timeSlot
  });
  await notifyWaitlistForSlot(req.io, booking.expert._id, booking.date, booking.timeSlot);

  res.status(StatusCodes.OK).json({
    message: "Booking cancelled successfully.",
    booking: normalizeBooking(booking)
  });
};

export const rescheduleBooking = async (req, res) => {
  const { date, timeSlot } = req.body;

  if (!datePattern.test(String(date || "").trim())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Date must be in YYYY-MM-DD format.");
  }

  if (!timeSlot || String(timeSlot).trim().length < 3) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "A valid time slot is required.");
  }

  const booking = await Booking.findById(req.params.id).populate("expert");

  if (!booking) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found.");
  }

  ensureBookingOwner(booking, req.user);

  ensureExpertHasSlot(booking.expert, String(date).trim(), String(timeSlot).trim());

  const previousDate = booking.date;
  const previousTimeSlot = booking.timeSlot;

  booking.previousSlot = {
    date: previousDate,
    timeSlot: previousTimeSlot
  };
  booking.date = String(date).trim();
  booking.timeSlot = String(timeSlot).trim();
  booking.status = "Confirmed";
  booking.cancellationReason = "";
  await booking.save();

  req.io.to(`bookings:${booking.email}`).emit("booking:status-updated", {
    booking: normalizeBooking(booking)
  });
  req.io.to(`expert:${booking.expert._id}`).emit("slot:released", {
    expertId: booking.expert._id,
    date: previousDate,
    timeSlot: previousTimeSlot
  });
  req.io.to(`expert:${booking.expert._id}`).emit("slot:booked", {
    expertId: booking.expert._id,
    date: booking.date,
    timeSlot: booking.timeSlot
  });
  await notifyWaitlistForSlot(req.io, booking.expert._id, previousDate, previousTimeSlot);

  res.status(StatusCodes.OK).json({
    message: "Booking rescheduled successfully.",
    booking: normalizeBooking(booking)
  });
};

export const joinWaitlist = async (req, res) => {
  const expertId = req.body.expertId;
  const name = String(req.body.name || req.user.name || "").trim();
  const email = String(req.user.email || "").trim().toLowerCase();
  const date = String(req.body.date || "").trim();
  const timeSlot = String(req.body.timeSlot || "").trim();
  const notes = String(req.body.notes || "").trim();
  const errors = [];

  if (!expertId || !mongoose.Types.ObjectId.isValid(expertId)) {
    errors.push("A valid expertId is required.");
  }

  if (!name || String(name).trim().length < 2) {
    errors.push("Name must be at least 2 characters long.");
  }

  if (!emailPattern.test(email)) {
    errors.push("A valid email address is required.");
  }

  if (!datePattern.test(date)) {
    errors.push("Date must be in YYYY-MM-DD format.");
  }

  if (!timeSlot || timeSlot.length < 3) {
    errors.push("A valid time slot is required.");
  }

  if (errors.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Validation failed.", errors);
  }

  const expert = await Expert.findById(expertId).lean();

  if (!expert) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Expert not found.");
  }

  ensureExpertHasSlot(expert, date, timeSlot);

  const entry = await WaitlistEntry.create({
    expert: expertId,
    name,
    email,
    date,
    timeSlot,
    notes
  });

  if (req.user.name !== name) {
    req.user.name = name;
    await req.user.save();
  }

  const populatedEntry = await WaitlistEntry.findById(entry._id).populate("expert", "name");

  res.status(StatusCodes.CREATED).json({
    message: "Added to waitlist successfully.",
    waitlistEntry: normalizeWaitlistEntry(populatedEntry)
  });
};

export const getWaitlistByEmail = async (req, res) => {
  const email = String(req.user.email || "").trim().toLowerCase();

  const entries = await WaitlistEntry.find({ email })
    .populate("expert", "name")
    .sort({ createdAt: -1 })
    .lean();

  res.status(StatusCodes.OK).json({
    data: entries.map(normalizeWaitlistEntry)
  });
};
