import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    phone: {
      type: String,
      default: "",
      trim: true
    },
    preferredLanguage: {
      type: String,
      default: "en",
      trim: true
    },
    profileCompleted: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    passwordHash: {
      type: String,
      required: true
    },
    passwordSalt: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
