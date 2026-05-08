import { StatusCodes } from "http-status-codes";
import { Expert } from "../models/Expert.js";
import { Booking } from "../models/Booking.js";
import { ApiError } from "../utils/ApiError.js";

const mapAvailability = (availability, bookedSlots) =>
  availability.map((entry) => ({
    date: entry.date,
    slots: entry.slots.map((time) => ({
      time,
      isBooked: bookedSlots.has(`${entry.date}__${time}`)
    }))
  }));

export const getExperts = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 24);
  const search = String(req.query.search || "").trim();
  const category = String(req.query.category || "").trim();

  const query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (category) {
    query.category = category;
  }

  const [experts, total, categories] = await Promise.all([
    Expert.find(query)
      .sort({ rating: -1, experience: -1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Expert.countDocuments(query),
    Expert.distinct("category")
  ]);

  res.status(StatusCodes.OK).json({
    data: experts,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      categories: categories.sort()
    }
  });
};

export const getExpertById = async (req, res) => {
  const expert = await Expert.findById(req.params.id).lean();

  if (!expert) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Expert not found.");
  }

  const availabilityDates = expert.availability.map((entry) => entry.date);
  const bookings = await Booking.find({
    expert: expert._id,
    date: { $in: availabilityDates }
  }).lean();

  const bookedSlots = new Set(bookings.map((item) => `${item.date}__${item.timeSlot}`));

  res.status(StatusCodes.OK).json({
    expert: {
      ...expert,
      availability: mapAvailability(expert.availability, bookedSlots)
    }
  });
};
