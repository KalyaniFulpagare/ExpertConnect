import { StatusCodes } from "http-status-codes";
import { Expert } from "../models/Expert.js";
import { Booking } from "../models/Booking.js";
import { ApiError } from "../utils/ApiError.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const calculateRating = (reviews, fallbackRating = 0) => {
  if (!reviews?.length) {
    return fallbackRating;
  }

  const total = reviews.reduce((sum, review) => sum + review.score, 0);
  return Number((total / reviews.length).toFixed(2));
};

const getNextAvailable = (availability) => {
  for (const day of availability) {
    if (day.slots.length > 0) {
      return `${day.date} ${day.slots[0]}`;
    }
  }

  return "Waitlist only";
};

const mapAvailability = (availability, bookedSlots) =>
  availability.map((entry) => ({
    date: entry.date,
    slots: entry.slots.map((time) => ({
      time,
      isBooked: bookedSlots.has(`${entry.date}__${time}`)
    }))
  }));

const presentExpertCard = (expert) => ({
  ...expert,
  nextAvailable: getNextAvailable(expert.availability || []),
  reviewCount: expert.reviews?.length || 0
});

const validateExpertPayload = (payload, partial = false) => {
  const errors = [];
  const required = (value, label) => {
    if (!partial && (!value || String(value).trim() === "")) {
      errors.push(`${label} is required.`);
    }
  };

  required(payload.name, "Name");
  required(payload.category, "Category");
  required(payload.bio, "Bio");

  if (payload.experience !== undefined && Number(payload.experience) < 0) {
    errors.push("Experience must be zero or greater.");
  }

  if (payload.pricePerSession !== undefined && Number(payload.pricePerSession) < 0) {
    errors.push("Price per session must be zero or greater.");
  }

  if (payload.rating !== undefined && (Number(payload.rating) < 0 || Number(payload.rating) > 5)) {
    errors.push("Rating must be between 0 and 5.");
  }

  return errors;
};

export const getExperts = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 24);
  const search = String(req.query.search || "").trim();
  const category = String(req.query.category || "").trim();
  const language = String(req.query.language || "").trim();
  const sortBy = String(req.query.sortBy || "top-rated").trim();
  const minRating = Number(req.query.minRating || 0);
  const maxPrice = Number(req.query.maxPrice || 0);
  const featured = req.query.featured === "true";

  const query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (category) {
    query.category = category;
  }

  if (language) {
    query.languages = language;
  }

  if (Number.isFinite(minRating) && minRating > 0) {
    query.rating = { ...(query.rating || {}), $gte: minRating };
  }

  if (Number.isFinite(maxPrice) && maxPrice > 0) {
    query.pricePerSession = { $lte: maxPrice };
  }

  if (featured) {
    query.featured = true;
  }

  const sortMap = {
    "top-rated": { featured: -1, rating: -1, experience: -1, name: 1 },
    "price-low": { pricePerSession: 1, rating: -1 },
    "price-high": { pricePerSession: -1, rating: -1 },
    experience: { experience: -1, rating: -1 },
    newest: { createdAt: -1 }
  };

  const sort = sortMap[sortBy] || sortMap["top-rated"];

  const [experts, total, categories] = await Promise.all([
    Expert.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Expert.countDocuments(query),
    Expert.distinct("category")
  ]);

  const languages = await Expert.distinct("languages");

  res.status(StatusCodes.OK).json({
    data: experts.map(presentExpertCard),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      categories: categories.sort(),
      languages: languages.sort()
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
      rating: calculateRating(expert.reviews, expert.rating),
      reviewCount: expert.reviews?.length || 0,
      nextAvailable: getNextAvailable(expert.availability || []),
      availability: mapAvailability(expert.availability, bookedSlots)
    }
  });
};

export const getRecommendedExperts = async (req, res) => {
  const currentExpert = await Expert.findById(req.params.id).lean();

  if (!currentExpert) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Expert not found.");
  }

  let recommendations = await Expert.find({
    _id: { $ne: currentExpert._id },
    category: currentExpert.category
  })
    .sort({ rating: -1, featured: -1 })
    .limit(3)
    .lean();

  if (recommendations.length < 3) {
    const sharedTags = currentExpert.tags || [];
    const fallback = await Expert.find({
      _id: { $ne: currentExpert._id },
      tags: { $in: sharedTags }
    })
      .sort({ rating: -1, experience: -1 })
      .limit(3)
      .lean();

    const seen = new Set(recommendations.map((expert) => String(expert._id)));
    for (const item of fallback) {
      if (!seen.has(String(item._id))) {
        recommendations.push(item);
        seen.add(String(item._id));
      }
    }
  }

  res.status(StatusCodes.OK).json({
    data: recommendations.slice(0, 3).map(presentExpertCard)
  });
};

export const createExpert = async (req, res) => {
  const errors = validateExpertPayload(req.body);

  if (errors.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Validation failed.", errors);
  }

  const expert = await Expert.create({
    ...req.body,
    rating: Number(req.body.rating || 4.8),
    reviews: req.body.reviews || []
  });

  res.status(StatusCodes.CREATED).json({
    message: "Expert created successfully.",
    expert: presentExpertCard(expert.toObject())
  });
};

export const updateExpert = async (req, res) => {
  const errors = validateExpertPayload(req.body, true);

  if (errors.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Validation failed.", errors);
  }

  const expert = await Expert.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).lean();

  if (!expert) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Expert not found.");
  }

  res.status(StatusCodes.OK).json({
    message: "Expert updated successfully.",
    expert: presentExpertCard(expert)
  });
};

export const addExpertReview = async (req, res) => {
  const name = String(req.body.name || req.user.name || "").trim();
  const email = String(req.user.email || "").trim().toLowerCase();
  const score = req.body.score;
  const comment = String(req.body.comment || "").trim();
  const errors = [];

  if (!name || name.length < 2) {
    errors.push("Reviewer name must be at least 2 characters long.");
  }

  if (!emailPattern.test(email)) {
    errors.push("A valid reviewer email is required.");
  }

  if (!Number.isFinite(Number(score)) || Number(score) < 1 || Number(score) > 5) {
    errors.push("Review score must be between 1 and 5.");
  }

  if (!comment || comment.length < 10) {
    errors.push("Review comment must be at least 10 characters long.");
  }

  if (errors.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Validation failed.", errors);
  }

  const expert = await Expert.findById(req.params.id);

  if (!expert) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Expert not found.");
  }

  expert.reviews.unshift({
    name,
    email,
    score: Number(score),
    comment
  });
  expert.rating = calculateRating(expert.reviews, expert.rating);
  await expert.save();

  res.status(StatusCodes.CREATED).json({
    message: "Review added successfully.",
    expert: {
      ...expert.toObject(),
      reviewCount: expert.reviews.length
    }
  });
};
