import { expertsSeed } from "../data/experts.js";
import { Expert } from "../models/Expert.js";

export const seedExpertsIfEmpty = async () => {
  const existingExperts = await Expert.countDocuments();

  if (existingExperts > 0) {
    return false;
  }

  await Expert.insertMany(expertsSeed);
  return true;
};
