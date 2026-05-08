import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true
    },
    slots: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    }
  },
  { timestamps: true }
);

const expertSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    experience: {
      type: Number,
      required: true,
      min: 0
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    bio: {
      type: String,
      required: true,
      trim: true
    },
    headline: {
      type: String,
      default: "",
      trim: true
    },
    company: {
      type: String,
      default: "",
      trim: true
    },
    languages: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    featured: {
      type: Boolean,
      default: false
    },
    sessionFormat: {
      type: String,
      default: "1:1 video session",
      trim: true
    },
    responseTime: {
      type: String,
      default: "Replies within 24h",
      trim: true
    },
    sessionsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    pricePerSession: {
      type: Number,
      required: true,
      min: 0
    },
    availability: {
      type: [availabilitySchema],
      default: []
    },
    reviews: {
      type: [reviewSchema],
      default: []
    }
  },
  { timestamps: true }
);

export const Expert = mongoose.model("Expert", expertSchema);
