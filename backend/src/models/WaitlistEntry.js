import mongoose from "mongoose";

const waitlistEntrySchema = new mongoose.Schema(
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
      maxlength: 280
    },
    status: {
      type: String,
      enum: ["Waiting", "Notified", "Converted"],
      default: "Waiting"
    }
  },
  { timestamps: true }
);

waitlistEntrySchema.index({ expert: 1, date: 1, timeSlot: 1, email: 1 }, { unique: true });

export const WaitlistEntry = mongoose.model("WaitlistEntry", waitlistEntrySchema);
