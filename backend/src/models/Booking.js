import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: String,
      required: true
    },
    timeSlot: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 400
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

bookingSchema.index({ expert: 1, date: 1, timeSlot: 1 }, { unique: true });

export const Booking = mongoose.model("Booking", bookingSchema);
