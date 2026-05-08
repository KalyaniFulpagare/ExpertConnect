import "dotenv/config";
import { connectDatabase } from "../config/db.js";
import { Expert } from "../models/Expert.js";
import { expertsSeed } from "../data/experts.js";

const run = async () => {
  await connectDatabase();
  await Expert.deleteMany({});
  await Expert.insertMany(expertsSeed);
  console.log(`Seeded ${expertsSeed.length} experts.`);
  process.exit(0);
};

run().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
