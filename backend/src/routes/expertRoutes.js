import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
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
router.post("/", asyncHandler(createExpert));
router.get("/:id/recommendations", asyncHandler(getRecommendedExperts));
router.post("/:id/reviews", asyncHandler(addExpertReview));
router.patch("/:id", asyncHandler(updateExpert));
router.get("/:id", asyncHandler(getExpertById));

export default router;
