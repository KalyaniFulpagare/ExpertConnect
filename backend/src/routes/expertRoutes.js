import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  addExpertReview,
  createExpert,
  getExpertById,
  getExperts,
  getRecommendedExperts,
  updateExpert
} from "../controllers/expertController.js";

const router = Router();

router.get("/", asyncHandler(getExperts));
router.post("/", requireAuth, asyncHandler(createExpert));
router.get("/:id/recommendations", asyncHandler(getRecommendedExperts));
router.post("/:id/reviews", requireAuth, asyncHandler(addExpertReview));
router.patch("/:id", requireAuth, asyncHandler(updateExpert));
router.get("/:id", asyncHandler(getExpertById));

export default router;
