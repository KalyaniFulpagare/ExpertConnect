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
    languages: {
      type: [String],
      default: []
    },
    pricePerSession: {
      type: Number,
      required: true,
      min: 0
    },
    availability: {
      type: [availabilitySchema],
      default: []
    }
  },
  { timestamps: true }
);

export const Expert = mongoose.model("Expert", expertSchema);
