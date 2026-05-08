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

export const upgradeSeedExperts = async () => {
  const existingExperts = await Expert.find({}).lean();

  if (!existingExperts.length) {
    return 0;
  }

  let updatesApplied = 0;

  for (const seedExpert of expertsSeed) {
    const existing = existingExperts.find((item) => item.name === seedExpert.name);

    if (!existing) {
      continue;
    }

    const update = {};
    const fillIfMissing = (field) => {
      const currentValue = existing[field];
      const isMissing =
        currentValue === undefined ||
        currentValue === null ||
        currentValue === "" ||
        (Array.isArray(currentValue) && currentValue.length === 0);

      if (isMissing && seedExpert[field] !== undefined) {
        update[field] = seedExpert[field];
      }
    };

    [
      "headline",
      "company",
      "tags",
      "featured",
      "sessionFormat",
      "responseTime",
      "sessionsCompleted",
      "reviews"
    ].forEach(fillIfMissing);

    if (Object.keys(update).length) {
      await Expert.updateOne({ _id: existing._id }, { $set: update });
      updatesApplied += 1;
    }
  }

  return updatesApplied;
};
