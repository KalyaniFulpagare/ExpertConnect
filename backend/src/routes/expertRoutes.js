import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getExpertById, getExperts } from "../controllers/expertController.js";

const router = Router();

router.get("/", asyncHandler(getExperts));
router.get("/:id", asyncHandler(getExpertById));

export default router;
