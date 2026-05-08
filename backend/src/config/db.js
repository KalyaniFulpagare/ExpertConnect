import mongoose from "mongoose";

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to backend/.env.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
};
